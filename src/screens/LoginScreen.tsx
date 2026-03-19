import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both Username and Password');
            return;
        }

        setLoading(true);
        try {
            await login(password, username);
        } catch (error) {
            Alert.alert('Error', (error as any).message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Driver Login</Text>
                    <Text style={styles.subtitle}>Smart Transport System</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Username"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.spacer} />

                    <PrimaryButton
                        title="LOG IN"
                        onPress={handleLogin}
                        isLoading={loading}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
        padding: theme.spacing.l,
        justifyContent: 'center',
    },
    header: {
        marginBottom: theme.spacing.xxl,
        alignItems: 'center',
    },
    title: {
        ...theme.typography.header,
        marginBottom: theme.spacing.s,
    },
    subtitle: {
        ...theme.typography.subHeader,
    },
    form: {
        width: '100%',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
    },
    inputGroup: {
        marginBottom: theme.spacing.m,
    },
    label: {
        ...theme.typography.body,
        fontWeight: '500',
        fontSize: 13,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.s,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: theme.colors.element,
        borderRadius: theme.borderRadius.m,
        paddingHorizontal: theme.spacing.m,
        fontSize: 17,
        color: theme.colors.text,
        backgroundColor: theme.colors.cardActive,
    },
    spacer: {
        height: theme.spacing.m,
    },
});
