import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getSession, saveSession, clearSession, DriverSession } from '../utils/SecureStorage';
import ApiClient from '../api/ApiClient';

interface AuthContextType {
    session: DriverSession | null;
    isLoading: boolean;
    login: (password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<DriverSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        const savedSession = await getSession();
        if (savedSession) {
            setSession(savedSession);
        }
        setIsLoading(false);
    };

    const login = async (password: string, username: string) => {
        try {
            console.log('[AuthContext] Attempting login for username:', username);

            // Call backend login
            const response = await ApiClient.post('/driver/login', { username, password });

            if (response.data.success) {
                const { driver } = response.data;
                console.log('[AuthContext] Login successful for driver:', driver.name);

                // Fetch assigned bus details
                let busData = null;
                try {
                    const busResponse = await ApiClient.get(`/driver/${driver.username}/bus`);
                    console.log('Bus Response:', JSON.stringify(busResponse.data, null, 2)); // DEBUGGING
                    busData = busResponse.data.bus;
                } catch (busError) {
                    console.log('No bus assigned or error fetching bus:', busError);
                    // Continue with null busData
                }

                // Enhanced Bus ID detection - Prioritize custom busId over MongoDB _id
                const detectedBusId = busData ? (busData.busId || busData._id || busData.id) : null;
                console.log('Detected Bus ID:', detectedBusId); // DEBUGGING

                const newSession: DriverSession = {
                    driverId: driver.username, // Using username as ID
                    driverName: driver.name,
                    driverEmail: driver.email || '', // stored for Face API auth
                    busNumber: busData ? busData.busNumber : 'No Bus',
                    busId: detectedBusId, // Store busId for tracking
                    routeId: 'N/A', // Fetched from bus if needed
                    routeName: busData && busData.route && busData.route.length > 0 ? `${busData.route[0].stopName} - ${busData.route[busData.route.length - 1].stopName}` : 'No Route',
                    totalStops: busData && busData.route ? busData.route.length : 0,
                    token: 'mock-token', // Backend uses session/cookie or hasn't implemented JWT yet from what we saw
                };

                setSession(newSession);
                await saveSession(newSession);
                console.log('[AuthContext] Session saved successfully');
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);

            // Provide more specific error messages
            if (error.message === 'Network Error') {
                const networkError = new Error(
                    'Cannot connect to server. Please check:\n' +
                    '1. Your WiFi connection\n' +
                    '2. Backend server is running\n' +
                    '3. You are on the same network as the server'
                );
                throw networkError;
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Connection timeout. Server is not responding.');
            } else if (error.response?.status === 401) {
                throw new Error('Invalid username or password');
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw error;
        }
    };

    const logout = async () => {
        console.log('[AuthContext] Logging out...');
        setSession(null);
        await clearSession();
        console.log('[AuthContext] Logout complete, session cleared');
    };

    return (
        <AuthContext.Provider value={{ session, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
