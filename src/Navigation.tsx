import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TrackingScreen } from './screens/TrackingScreen';
import { FaceScanGateScreen } from './screens/FaceScanGateScreen';
import { useAuth } from './context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

const Stack = createNativeStackNavigator();

export const Navigation = () => {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="FaceScanGate" component={FaceScanGateScreen} />
                        <Stack.Screen name="Tracking" component={TrackingScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
