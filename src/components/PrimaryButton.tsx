import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'danger' | 'warning' | 'secondary';
    isLoading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    isLoading = false,
    disabled = false,
    style
}) => {
    let backgroundColor = theme.colors.text; // Default to white
    let textColor = theme.colors.background; // Default to black

    if (variant === 'danger') {
        backgroundColor = theme.colors.error;
        textColor = '#FFFFFF';
    }
    if (variant === 'warning') {
        backgroundColor = theme.colors.warning;
        textColor = '#000000';
    }
    if (variant === 'secondary') {
        backgroundColor = theme.colors.element;
        textColor = '#FFFFFF';
    }

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor }, style]}
            onPress={onPress}
            disabled={isLoading || disabled}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56, // Modern sizing
        borderRadius: theme.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    text: {
        ...theme.typography.button,
    },
});
