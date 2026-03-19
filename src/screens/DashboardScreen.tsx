import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen = () => {
    const { session, logout } = useAuth();
    const navigation = useNavigation<any>();

    const handleStartJourney = () => {
        // Face verification gate — navigate to face scan first.
        // On success, FaceScanGateScreen will navigate to Tracking.
        navigation.navigate('FaceScanGate');
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusPillText}>Online • 5G</Text>
                    </View>
                    <Text style={[styles.title, { marginTop: 12 }]}>Welcome,</Text>
                    <Text style={styles.driverName}>{session?.driverName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logout}>Log Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Assignment Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Bus Number:</Text>
                    <Text style={styles.value}>{session?.busNumber}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.label}>Route:</Text>
                    <Text style={styles.value}>{session?.routeName}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Route Summary</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Start</Text>
                        <Text style={styles.summaryValue}>
                            {session?.routeName && session.routeName.includes(' - ')
                                ? session.routeName.split(' - ')[0]
                                : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.arrow}>
                        <Text style={styles.arrowText}>→</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>End</Text>
                        <Text style={styles.summaryValue}>
                            {session?.routeName && session.routeName.includes(' - ')
                                ? session.routeName.split(' - ')[1]
                                : 'N/A'}
                        </Text>
                    </View>
                </View>
                <View style={styles.stopsCount}>
                    <Text style={styles.stopsText}>Total Stops: {session?.totalStops || 0}</Text>
                </View>
            </View>

            <View style={styles.spacer} />

            <View style={styles.footer}>
                <PrimaryButton
                    title="START JOURNEY"
                    onPress={handleStartJourney}
                    variant="secondary"
                />
            </View>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.l,
    },
    title: {
        ...theme.typography.subHeader,
        fontSize: 16,
    },
    driverName: {
        ...theme.typography.header,
    },
    logout: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 14,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.m,
    },
    cardTitle: {
        ...theme.typography.subHeader,
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.element,
        marginVertical: theme.spacing.m,
    },
    label: {
        ...theme.typography.body,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },
    value: {
        ...theme.typography.body,
        fontSize: 17,
        fontWeight: '600',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '500',
    },
    summaryValue: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.text,
    },
    arrow: {
        paddingHorizontal: theme.spacing.s,
    },
    arrowText: {
        fontSize: 20,
        color: theme.colors.textTertiary,
    },
    stopsCount: {
        alignItems: 'center',
        backgroundColor: theme.colors.element,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
    },
    stopsText: {
        color: theme.colors.success,
        fontWeight: '600',
        fontSize: 14,
    },
    spacer: {
        flex: 1,
    },
    footer: {
        marginBottom: theme.spacing.l,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.l,
    },
    statusPill: {
        backgroundColor: theme.colors.element,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    statusPillText: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    statusText: {
        textAlign: 'center',
        marginBottom: theme.spacing.m,
        fontSize: 16,
        color: theme.colors.darkGray,
    },
    inactive: {
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
});
