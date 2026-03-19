import React, { createContext, useState, useContext, ReactNode } from 'react';

interface LocationData {
    latitude: number;
    longitude: number;
    speed: number | null; // Speed in m/s
    timestamp?: number;
}

interface NextStopData {
    name: string;
    etaMinutes: number;
}

interface LocationContextType {
    location: LocationData | null;
    setLocation: (loc: LocationData) => void;
    nextStop: NextStopData | null;
    setNextStop: (stop: NextStopData | null) => void;
    isTracking: boolean;
    setIsTracking: (tracking: boolean) => void;
    errorMsg: string | null;
    setErrorMsg: (msg: string | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [nextStop, setNextStop] = useState<NextStopData | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    return (
        <LocationContext.Provider value={{ location, setLocation, nextStop, setNextStop, isTracking, setIsTracking, errorMsg, setErrorMsg }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocationContext = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocationContext must be used within a LocationProvider');
    }
    return context;
};
