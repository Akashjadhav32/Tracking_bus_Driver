import * as SecureStore from 'expo-secure-store';

const DRIVER_SESSION_KEY = 'driver_session';

export interface DriverSession {
    driverId: string;
    driverName: string;
    driverEmail: string;   // needed for Face API login
    busNumber: string;
    busId?: string; // Added for tracking
    routeId: string;
    routeName: string;
    totalStops?: number;
    token: string;
}

export const saveSession = async (session: DriverSession) => {
    try {
        await SecureStore.setItemAsync(DRIVER_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.error('Error saving session', error);
    }
};

export const getSession = async (): Promise<DriverSession | null> => {
    try {
        const session = await SecureStore.getItemAsync(DRIVER_SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (error) {
        console.error('Error getting session', error);
        return null;
    }
};

export const clearSession = async () => {
    try {
        await SecureStore.deleteItemAsync(DRIVER_SESSION_KEY);
    } catch (error) {
        console.error('Error clearing session', error);
    }
};
