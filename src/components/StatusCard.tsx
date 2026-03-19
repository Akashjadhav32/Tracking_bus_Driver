import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

interface StatusCardProps {
    label: string;
    value: string;
    active?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, value, active = false }) => {
    return (
        <View style={[styles.card, active && styles.activeCard]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: theme.spacing.m,
        backgroundColor: theme.colors.gray,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        marginVertical: theme.spacing.s,
        width: '45%',
    },
    activeCard: {
        backgroundColor: theme.colors.success + '20', // Low opacity green
        borderColor: theme.colors.success,
        borderWidth: 1,
    },
    label: {
        ...theme.typography.subHeader,
        fontSize: 14,
        marginBottom: theme.spacing.xs,
    },
    value: {
        ...theme.typography.header,
        fontSize: 20,
    },
});
