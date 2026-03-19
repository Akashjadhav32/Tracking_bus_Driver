import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { addToQueue, getQueue, removeFromQueue } from '../utils/OfflineQueue';
import { API_BASE_URL } from '../config';

const ApiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor - Log all outgoing requests
ApiClient.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log('[API Request Data]:', config.data);
        return config;
    },
    (error) => {
        console.error('[API Request Error]:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor - Handle errors with detailed logging
ApiClient.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('[API Error] Request timeout - Server took too long to respond');
        } else if (error.message === 'Network Error') {
            console.error('[API Error] Network Error - Cannot reach server');
            console.error('[API Error] Check if:');
            console.error('  1. Backend server is running on port 4000');
            console.error('  2. Your device is on the same WiFi network as your PC');
            console.error(`  3. The IP address in config.ts (${API_BASE_URL}) is correct`);
            console.error('  4. Your PC firewall allows connections on port 4000');
        } else if (error.response) {
            console.error(`[API Error] ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else {
            console.error('[API Error]:', error.message);
        }
        return Promise.reject(error);
    }
);

// Update payload to match backend expectation
export const sendLocationUpdate = async (latitude: number, longitude: number, speed: number | null, busId: string) => {
    const payload = {
        busId,
        lat: latitude,
        lng: longitude,
        speed: speed || 0,
        // timestamp: new Date().toISOString(), // Backend likely adds this
    };

    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
        // Offline: Add to Queue
        console.log('Offline: Queuing location update');
        await addToQueue(payload as any);
        return { status: 'queued' };
    }

    try {
        // Online: Try to send
        const response = await ApiClient.post('/bus/update-location', payload);

        // Also try to sync any queued items
        syncQueue();

        return response;
    } catch (error) {
        console.error('Error sending location, queuing:', error);
        // If request failed (e.g. timeout), queue it
        await addToQueue(payload as any);
        throw error;
    }
};

// Report bus breakdown
export const reportBreakdown = async (busId: string, lat?: number, lng?: number) => {
    try {
        const payload: any = { busId };
        if (lat !== undefined && lng !== undefined) {
            payload.lat = lat;
            payload.lng = lng;
        }
        const response = await ApiClient.post('/breakdown/report', payload);
        return response.data;
    } catch (error) {
        console.error('Error reporting breakdown:', error);
        throw error;
    }
};

// Resolve bus breakdown
export const resolveBreakdown = async (busId: string) => {
    try {
        const response = await ApiClient.post(`/breakdown/resolve/${busId}`);
        return response.data;
    } catch (error) {
        console.error('Error resolving breakdown:', error);
        throw error;
    }
};

const syncQueue = async () => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline locations...`);

    // Create a batch or send individually. 
    // For simplicity here, we'll try to send them one by one or in a batch if the API supported it.
    // Assuming we iterate and send.

    // NOTE: In production, batch endpoint is better.
    let sentCount = 0;
    for (const item of queue) {
        try {
            await ApiClient.post('/bus/update-location', item);
            sentCount++;
        } catch (error) {
            console.error('Error syncing queued item:', error);
            break; // Stop syncing if error occurs
        }
    }

    if (sentCount > 0) {
        await removeFromQueue(sentCount);
        console.log(`Synced ${sentCount} items.`);
    }
};

export default ApiClient;
