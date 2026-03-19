import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { getSession } from '../utils/SecureStorage';

// Use the same host IP as the rest of the app.
// If you change API_BASE_URL in config.ts, update this too.
const BACKEND_URL = 'https://akash123-071-tracking-backend.hf.space';

export const FaceScanGateScreen = () => {
    const navigation = useNavigation<any>();
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const successOpacity = useRef(new Animated.Value(0)).current;

    // Request camera permission on mount
    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const showSuccess = () => {
        setSuccessVisible(true);
        Animated.sequence([
            Animated.timing(successOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(1500),
            Animated.timing(successOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setSuccessVisible(false);
            navigation.navigate('Tracking');
        });
    };

    const handleScan = async () => {
        if (!cameraRef.current || isScanning) return;
        setIsScanning(true);

        try {
            // ── Step 0: get driver email from session ──────────────────────
            const storedSession = await getSession();
            const driverEmail = storedSession?.driverEmail;
            const driverPassword = storedSession?.driverId; // we use username/driverId as the password is not stored; see note below*

            if (!driverEmail) {
                Alert.alert(
                    'Session Error',
                    'Driver email not found. Please log out and log back in.',
                    [{ text: 'OK' }]
                );
                setIsScanning(false);
                return;
            }

            // ── Step 1: capture selfie ─────────────────────────────────────
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
                skipProcessing: true,
            });

            if (!photo?.uri) throw new Error('Failed to capture photo');

            // ── Step 2: login to Face API with driver's email & password ───
            // The Face API password is the plaintext password that was set
            // during driver registration (attendanceService sends it as form field).
            // We don't have it here, so we use a known shared secret stored in
            // the Face API's .env, OR we ask the backend to proxy this call.
            // For now we proxy through our backend's /api/attendance/mark-proxy.
            // ── SIMPLER APPROACH: proxy through backend ────────────────────
            // POST selfie → our backend → backend calls Face API with its admin token
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const formData = new FormData();

            // ALWAYS append non-file fields before file fields for multer
            formData.append('driverId', storedSession?.driverId ?? '');
            formData.append('driverEmail', driverEmail);

            formData.append('file', {
                uri: photo.uri,
                name: 'scan.jpg',
                type: 'image/jpeg',
            } as any);

            // POST to our own backend which will authenticate with Face API
            const backendUrl = `${BACKEND_URL}/api/attendance/scan`;
            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                showSuccess();
            } else {
                const message = data?.message || data?.detail || 'Face not recognised. Please try again.';
                Alert.alert('❌ Identity Check Failed', message, [{ text: 'Retry' }]);
            }

        } catch (err: any) {
            console.error('[FaceScanGate] error:', err);
            if (err?.name === 'AbortError') {
                Alert.alert('Request Timed Out', 'The server took too long to respond. Make sure all services are running.', [{ text: 'Retry' }]);
            } else {
                Alert.alert('Connection Error', `Could not reach the server. Make sure the backend and Face API are both running.\n\n${err?.message || ''}`, [{ text: 'Retry' }]);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // Camera permission not yet determined
    if (!permission) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.infoText}>Requesting camera permission…</Text>
            </SafeAreaView>
        );
    }

    // Camera permission denied
    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorTitle}>Camera Permission Required</Text>
                <Text style={styles.infoText}>
                    This screen needs camera access to verify your identity before starting the journey.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
                    <Text style={styles.retryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Identity Verification</Text>
                <View style={{ width: 50 }} />
            </View>

            <Text style={styles.subtitle}>
                Look directly at the camera, then tap "Scan Face"
            </Text>

            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFillObject}
                    facing={'front' as CameraType}
                />

                {/* Face oval overlay guide - physically over the camera via absoluteFillObject */}
                <View style={[StyleSheet.absoluteFillObject, styles.cameraOverlay]}>
                    <View style={styles.ovalGuide} />
                </View>
            </View>

            {/* Scan Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                    onPress={handleScan}
                    disabled={isScanning}
                >
                    {isScanning ? (
                        <>
                            <ActivityIndicator color="#000000" />
                            <Text style={styles.scanButtonText}>Verifying…</Text>
                        </>
                    ) : (
                        <Text style={styles.scanButtonText}>Scan Face</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Success Overlay */}
            {successVisible && (
                <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
                    <Text style={styles.successEmoji}>✅</Text>
                    <Text style={styles.successTitle}>Identity Verified</Text>
                    <Text style={styles.successSub}>Starting your journey…</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.l,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    backText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '600',
        width: 50,
    },
    title: {
        ...theme.typography.subHeader,
        fontSize: 18,
        textAlign: 'center',
        color: theme.colors.text,
    },
    subtitle: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 13,
        marginHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.m,
    },
    cameraContainer: {
        flex: 1,
        marginHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    cameraOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none', // Lets touches pass through to camera if needed
    },
    ovalGuide: {
        width: 200,
        height: 250,
        borderRadius: 120,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
        borderStyle: 'dashed',
    },
    footer: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.l,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.m,
    },
    scanButtonDisabled: {
        opacity: 0.7,
    },
    scanButtonText: {
        color: '#000000',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    retryButton: {
        marginTop: theme.spacing.l,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
    },
    retryButtonText: {
        color: '#000000',
        fontWeight: '700',
    },
    errorTitle: {
        ...theme.typography.header,
        fontSize: 20,
        marginBottom: theme.spacing.s,
        textAlign: 'center',
    },
    infoText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.s,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: theme.spacing.m,
    },
    successTitle: {
        color: theme.colors.primary,
        fontSize: 28,
        fontWeight: '800',
        marginBottom: theme.spacing.s,
    },
    successSub: {
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
});
