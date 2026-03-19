# 🚌 Bus Tracking - Driver Mobile Application

A cross-platform mobile application built with **React Native** and **Expo** tailored specifically for bus drivers in the Smart Public Transport Tracking System. It completely handles secure driver identity verification and real-time location streaming to the master cluster.

## ✨ Key Features
- **Face Recognition Identity Check:** Uses advanced DeepFace geometry (via cloud API proxy) to securely scan and verify the driver's face before allowing them to start a journey.
- **Continuous Live Tracking:** Employs precise GPS streaming to send coordinates (latitude, longitude, and speed) every few seconds to the tracking backend.
- **Offline & Low Connectivity Support:** If the network drops, GPS pings are placed in a queue and automatically synchronized back to the server once the connection is restored.
- **Dynamic Bus Allocation:** Automatically fetches the driver's assigned bus and route map immediately after login.
- **Cross-Platform:** Codebase is unified in TypeScript and runs beautifully on both Android and iOS devices.

## 🛠 Tech Stack
- **Framework:** React Native / Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (Stack)
- **APIs:** Axios with automatic timeout policies
- **Sensors:** `expo-camera` (Identity Verification) and `expo-location` (GPS Telemetry)
- **Local Storage:** `expo-secure-store` & `@react-native-async-storage` for Queueing

## 🚀 Getting Started

### Local Development Setup
1. Ensure you have Node.js and the **EAS CLI** installed:
   ```bash
   npm install -g eas-cli
   ```
2. Clone this repository and move into it:
   ```bash
   cd driver
   npm install
   ```
3. Run the development server (make sure you connect your mobile device with `Expo Go` app):
   ```bash
   npm run dev
   # OR
   expo start --tunnel
   ```
   *(Running with `--tunnel` enables you to access the app flawlessly across different networks via Ngrok!)*

### 🔑 Configuration
Open `src/config.ts` to inspect the backend connection URL. It natively points directly to the cloud backend hosted on Hugging Face:
```typescript
export const API_BASE_URL = 'https://[your-backend].hf.space/api';
```

### 📦 Building an APK for Android
This repository is configured natively to produce local `.apk` binary files via Expo Application Services.
```bash
eas build -p android --profile preview
```

## 📸 Security Features
To ensure the correct driver is operating the correct bus, no GPS telemetry begins until the `FaceScanGateScreen` securely takes a biometric selfie and transmits it over an encrypted payload to the system backend. Only validated faces allow access to the Tracking Interface.
