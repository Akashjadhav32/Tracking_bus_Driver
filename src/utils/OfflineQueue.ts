import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_location_queue';

export interface LocationPayload {
    busId?: string;
    lat: number;
    lng: number;
    speed: number | null;
    timestamp?: string;
}

export const addToQueue = async (data: LocationPayload) => {
    try {
        const currentQueue = await getQueue();
        currentQueue.push(data);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));
    } catch (error) {
        console.error('Error adding to queue', error);
    }
};

export const getQueue = async (): Promise<LocationPayload[]> => {
    try {
        const queue = await AsyncStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('Error getting queue', error);
        return [];
    }
};

export const clearQueue = async () => {
    try {
        await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
        console.error('Error clearing queue', error);
    }
};

export const removeFromQueue = async (count: number) => {
    try {
        const currentQueue = await getQueue();
        const newQueue = currentQueue.slice(count);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    } catch (error) {
        console.error('Error removing from queue', error);
    }
}
