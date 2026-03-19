import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { sendLocationUpdate } from '../api/ApiClient';

export const useLocationTracking = () => {
    const { setLocation, setIsTracking, setErrorMsg, setNextStop } = useLocationContext();
    const { session } = useAuth();
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const lastUpdateRef = useRef<number>(0);

    const startTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            setIsTracking(true);
            setErrorMsg(null);

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000, // Update UI every second
                    distanceInterval: 1, // Update on small movements
                },
                async (location) => {
                    const { latitude, longitude, speed } = location.coords;

                    // Update UI immediately
                    setLocation({
                        latitude,
                        longitude,
                        speed,
                        timestamp: location.timestamp,
                    });

                    // Throttle backend updates (every 30 seconds)
                    const now = Date.now();
                    if (!lastUpdateRef.current || now - lastUpdateRef.current >= 30000) {
                        try {
                            if (session?.busId) {
                                const response = await sendLocationUpdate(latitude, longitude, speed, session.busId);
                                lastUpdateRef.current = now;
                                console.log('Backend updated at', new Date(now).toLocaleTimeString());

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
