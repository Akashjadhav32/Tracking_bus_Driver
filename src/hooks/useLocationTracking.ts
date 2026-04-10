import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { sendLocationUpdate } from '../api/ApiClient';

// Haversine formula: distance between two GPS points in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Constants
const BACKEND_UPDATE_INTERVAL_MS = 15000; // Send to backend every 15 seconds
const SPEED_HISTORY_SIZE = 5; // Rolling average over 5 GPS readings
const MAX_VALID_SPEED_KMH = 120; // Ignore speed readings above this (GPS glitch)
const STATIONARY_THRESHOLD_KMH = 3; // Below this = stationary (GPS drift noise)
const MIN_ACCURACY_FOR_SPEED = 20; // Ignore speed if GPS accuracy is worse than 20m

export const useLocationTracking = () => {
    const { setLocation, setIsTracking, setErrorMsg, setNextStop } = useLocationContext();
    const { session } = useAuth();
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const speedHistoryRef = useRef<number[]>([]);
    const isFirstUpdateRef = useRef(true);
    const lastPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

    // Compute a smoothed speed from the rolling history (km/h)
    const getSmoothedSpeedKmh = useCallback((
        rawSpeedMs: number | null,
        accuracy: number | null,
        latitude: number,
        longitude: number,
        timestamp: number
    ): number => {
        // If GPS accuracy is too poor, don't trust the speed
        if (accuracy != null && accuracy > MIN_ACCURACY_FOR_SPEED) {
            speedHistoryRef.current.push(0);
            if (speedHistoryRef.current.length > SPEED_HISTORY_SIZE) {
                speedHistoryRef.current.shift();
            }
            return 0;
        }

        // Convert m/s to km/h
        let speedKmh = rawSpeedMs != null && rawSpeedMs >= 0
            ? rawSpeedMs * 3.6
            : 0;

        // Filter out GPS glitches (impossibly high speeds)
        if (speedKmh > MAX_VALID_SPEED_KMH) {
            speedKmh = 0;
        }

        // Cross-check with position-based speed calculation
        // This catches cases where GPS reports speed but position hasn't actually changed
        if (lastPositionRef.current && speedKmh > 0) {
            const timeDeltaS = (timestamp - lastPositionRef.current.time) / 1000;
            if (timeDeltaS > 0.5) { // Need at least 0.5s between readings
                const distM = getDistanceMeters(
                    lastPositionRef.current.lat, lastPositionRef.current.lng,
                    latitude, longitude
                );
                const posBasedSpeedKmh = (distM / timeDeltaS) * 3.6;

                // If position says we barely moved but GPS reports speed, trust position
                if (posBasedSpeedKmh < STATIONARY_THRESHOLD_KMH && speedKmh < 10) {
                    speedKmh = 0;
                }
            }
        }
        lastPositionRef.current = { lat: latitude, lng: longitude, time: timestamp };

        // Dead zone: below threshold = stationary (GPS drift noise)
        if (speedKmh < STATIONARY_THRESHOLD_KMH) {
            speedKmh = 0;
        }

        // Add to rolling history (include zeros so stopping is responsive)
        speedHistoryRef.current.push(speedKmh);
        if (speedHistoryRef.current.length > SPEED_HISTORY_SIZE) {
            speedHistoryRef.current.shift();
        }

        // Compute average of all values (zeros included)
        const history = speedHistoryRef.current;
        const sum = history.reduce((a, b) => a + b, 0);
        const avg = sum / history.length;

        // Final dead zone check on the averaged value
        if (avg < STATIONARY_THRESHOLD_KMH) return 0;

        return Math.round(avg * 10) / 10;
    }, []);

    const startTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            setIsTracking(true);
            setErrorMsg(null);
            speedHistoryRef.current = [];
            isFirstUpdateRef.current = true;
            lastPositionRef.current = null;

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000, // Update UI every second
                    distanceInterval: 1, // Update on small movements
                },
                async (location) => {
                    const { latitude, longitude, speed: rawSpeedMs, accuracy } = location.coords;

                    // Compute smoothed speed in km/h
                    const smoothedSpeedKmh = getSmoothedSpeedKmh(
                        rawSpeedMs, accuracy, latitude, longitude, location.timestamp
                    );

                    // Update UI immediately with smoothed speed (stored as km/h now)
                    setLocation({
                        latitude,
                        longitude,
                        speed: smoothedSpeedKmh, // Now in km/h
                        timestamp: location.timestamp,
                    });

                    // Throttle backend updates
                    const now = Date.now();
                    const shouldSend = isFirstUpdateRef.current || 
                        (now - lastUpdateRef.current >= BACKEND_UPDATE_INTERVAL_MS);
                    
                    if (shouldSend) {
                        try {
                            if (session?.busId) {
                                // Send speed in km/h to backend (backend stores as-is)
                                const response = await sendLocationUpdate(
                                    latitude, 
                                    longitude, 
                                    smoothedSpeedKmh, // km/h — consistent with user frontend display
                                    session.busId
                                );
                                lastUpdateRef.current = now;
                                isFirstUpdateRef.current = false;
                                console.log('Backend updated at', new Date(now).toLocaleTimeString(), 
                                    '| Speed:', smoothedSpeedKmh, 'km/h');

                                // Extract next stop from response (skip stops already passed)
                                if (response && response.data && response.data.etaStops && response.data.etaStops.length > 0) {
                                    // Find first stop with ETA > 0 (upcoming stop, not already passed)
                                    const nextUpcoming = response.data.etaStops.find((stop: any) => stop.etaMinutes > 0);
                                    if (nextUpcoming) {
                                        setNextStop({
                                            name: nextUpcoming.name,
                                            etaMinutes: nextUpcoming.etaMinutes
                                        });
                                    } else {
                                        // All stops passed or at final destination
                                        setNextStop(null);
                                    }
                                } else {
                                    setNextStop(null);
                                }
                            } else {
                                console.warn('No Bus ID found in session, cannot track');
                            }
                        } catch (err) {
                            // Already logged internally
                        }
                    }
                }
            );
        } catch (error) {
            console.error(error);
            setErrorMsg('Error starting location tracking');
            setIsTracking(false);
        }
    };

    const stopTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        setIsTracking(false);
        speedHistoryRef.current = [];
        isFirstUpdateRef.current = true;
        lastPositionRef.current = null;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []);

    return { startTracking, stopTracking };
};

