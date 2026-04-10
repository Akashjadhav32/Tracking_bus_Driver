import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { sendLocationUpdate } from '../api/ApiClient';

// Constants
const BACKEND_UPDATE_INTERVAL_MS = 15000; // Send to backend every 15 seconds
const SPEED_HISTORY_SIZE = 5; // Rolling average over 5 GPS readings
const MAX_VALID_SPEED_KMH = 120; // Ignore speed readings above this (GPS glitch)
const MIN_VALID_SPEED_KMH = 0; // Floor at 0

export const useLocationTracking = () => {
    const { setLocation, setIsTracking, setErrorMsg, setNextStop } = useLocationContext();
    const { session } = useAuth();
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const speedHistoryRef = useRef<number[]>([]);
    const isFirstUpdateRef = useRef(true);

    // Compute a smoothed speed from the rolling history (km/h)
    const getSmoothedSpeedKmh = useCallback((rawSpeedMs: number | null): number => {
        // Convert m/s to km/h, clamp to valid range
        let speedKmh = rawSpeedMs != null && rawSpeedMs >= 0
            ? rawSpeedMs * 3.6
            : 0;

        // Filter out GPS glitches (impossibly high speeds)
        if (speedKmh > MAX_VALID_SPEED_KMH) {
            speedKmh = 0;
        }

        // Add to rolling history
        speedHistoryRef.current.push(speedKmh);
        if (speedHistoryRef.current.length > SPEED_HISTORY_SIZE) {
            speedHistoryRef.current.shift();
        }

        // Compute average, excluding zeros if we have non-zero values
        const history = speedHistoryRef.current;
        const nonZero = history.filter(s => s > 0);
        if (nonZero.length === 0) return 0;

        const sum = nonZero.reduce((a, b) => a + b, 0);
        const avg = sum / nonZero.length;

        return Math.max(MIN_VALID_SPEED_KMH, Math.round(avg * 10) / 10);
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

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000, // Update UI every second
                    distanceInterval: 1, // Update on small movements
                },
                async (location) => {
                    const { latitude, longitude, speed: rawSpeedMs } = location.coords;

                    // Compute smoothed speed in km/h
                    const smoothedSpeedKmh = getSmoothedSpeedKmh(rawSpeedMs);

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

