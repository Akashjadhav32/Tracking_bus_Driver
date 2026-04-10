import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useLocationContext } from '../context/LocationContext';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { reportBreakdown, resolveBreakdown } from '../api/ApiClient';

export const TrackingScreen = () => {
    const { location, isTracking, nextStop } = useLocationContext();
    const { startTracking, stopTracking } = useLocationTracking();
    const navigation = useNavigation<any>();
    const { session } = useAuth();
    const [isReportingBreakdown, setIsReportingBreakdown] = useState(false);
    const [isBreakdownReported, setIsBreakdownReported] = useState(false);

    useEffect(() => {
        // Start tracking on mount
        startTracking();

        // Prevent accidental back press
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Stop Journey?',
                'Are you sure you want to stop the journey?',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => { } },
                    { text: 'Stop', style: 'destructive', onPress: handleStopJourney },
                ]
            );
            return true;
        });

        return () => {
            backHandler.remove();
        };
    }, []);

    const handleStopJourney = () => {
        stopTracking();
        navigation.goBack();
    };

    const handleBreakdownReport = () => {
        if (isBreakdownReported) {
            // Mark as repaired
            Alert.alert(
                'Mark Bus as Repaired',
                'Confirm that the bus has been repaired and is operational?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Confirm',
                        style: 'default',
                        onPress: async () => {
                            if (!session?.busId) {
                                Alert.alert('Error', 'Bus ID not found');
                                return;
                            }
                            setIsReportingBreakdown(true);
                            try {
                                await resolveBreakdown(session.busId);
                                setIsBreakdownReported(false);
                                Alert.alert('Success', 'Bus marked as repaired');
                            } catch (error) {
                                Alert.alert('Error', 'Failed to update status');
                            } finally {
                                setIsReportingBreakdown(false);
                            }
                        },
                    },
                ]
            );
        } else {
            // Report breakdown
            Alert.alert(
                'Report Bus Breakdown',
                'Are you sure you want to report a breakdown? This will alert admin and users.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Report',
                        style: 'destructive',
                        onPress: async () => {
                            if (!session?.busId) {
                                Alert.alert('Error', 'Bus ID not found');
                                return;
                            }
                            setIsReportingBreakdown(true);
                            try {
                                await reportBreakdown(session.busId, location?.latitude, location?.longitude);
                                setIsBreakdownReported(true);
                                Alert.alert('Success', 'Breakdown reported successfully');
                            } catch (error) {
                                Alert.alert('Error', 'Failed to report breakdown');
                            } finally {
                                setIsReportingBreakdown(false);
                            }
                        },
                    },
                ]
            );
        }
    };

    // Speed is already in km/h (converted in useLocationTracking)
    const speedKmh = location?.speed ? Math.max(0, location.speed).toFixed(0) : '0';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>JOURNEY ACTIVE</Text>
                <View style={styles.badge} />
            </View>

            <View style={styles.meterContainer}>
                <View style={styles.speedCircle}>
                    <Text style={styles.speedValue}>{speedKmh}</Text>
                    <Text style={styles.speedUnit}>km/h</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                {/* Next Stop Indicator */}
                {nextStop ? (
                    <View style={styles.nextStopContainer}>
                        <Text style={styles.nextStopLabel}>NEXT STOP</Text>
                        <Text style={styles.nextStopValue}>{nextStop.name}</Text>
                    </View>
                ) : (
                    <Text style={styles.waitingText}>Calculating next stop...</Text>
                )}

                <Text style={styles.infoLabel}>Latest Coordinates:</Text>
                <Text style={styles.infoValue}>
                    {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Acquiring GPS...'}
                </Text>
                <Text style={styles.updateNote}>Updates every 15 seconds</Text>
            </View>

            <View style={styles.footer}>
                <PrimaryButton
                    title={isBreakdownReported ? "✅ MARK AS REPAIRED" : "🚨 BUS BREAKDOWN"}
                    onPress={handleBreakdownReport}
                    variant={isBreakdownReported ? "primary" : "warning"}
                    disabled={isReportingBreakdown}
                />
                <View style={{ height: 12 }} />
                <PrimaryButton
                    title="STOP JOURNEY"
                    onPress={handleStopJourney}
                    variant="danger"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.m,
    },
    header: {
        marginTop: theme.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
    },
    title: {
        ...theme.typography.button,
        color: theme.colors.primary,
        letterSpacing: 1,
        marginRight: theme.spacing.s,
    },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    meterContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 8,
        borderColor: theme.colors.element,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    speedValue: {
        fontSize: 72,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -2,
    },
    speedUnit: {
        fontSize: 20,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        marginTop: -5,
    },
    infoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.s,
    },
    updateNote: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xs,
    },
    footer: {
        marginBottom: theme.spacing.l,
    },
    nextStopContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.l,
        backgroundColor: theme.colors.card,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.colors.element,
    },
    nextStopLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        letterSpacing: 1.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    nextStopValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    etaValue: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.success,
    },
    waitingText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.m,
        fontStyle: 'italic',
    },
});
