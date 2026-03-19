import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './src/context/LocationContext';
import { AuthProvider } from './src/context/AuthContext';
import { Navigation } from './src/Navigation';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <SafeAreaProvider>
          <View style={styles.container}>
            <Navigation />
            <StatusBar style="auto" />
          </View>
        </SafeAreaProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
