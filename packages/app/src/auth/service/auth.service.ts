/* eslint-disable lingui/no-unlocalized-strings */
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { expoDb } from '../../@generic/drizzle/db/db';

const PIN_KEY = 'user_pin';

class AuthService {
    async isBiometricAvailable(): Promise<boolean> {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        return compatible && enrolled;
    }

    async getBiometricTypes() {
        try {
            const [hasHardware, isEnrolled, types] = await Promise.all([
                LocalAuthentication.hasHardwareAsync(),
                LocalAuthentication.isEnrolledAsync(),
                LocalAuthentication.supportedAuthenticationTypesAsync()
            ]);

            const isAvailable = hasHardware && isEnrolled;

            const isFaceIdAvailable = isAvailable && types.some(type => type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
            const isTouchIdAvailable = isAvailable && types.some(type => type === LocalAuthentication.AuthenticationType.FINGERPRINT);

            return {
                isSomeAvailable: isFaceIdAvailable || isTouchIdAvailable,
                isTouchIdAvailable,
                isFaceIdAvailable,
                isLoading: false
            };
        } catch {
            return {
                isTouchIdAvailable: false,
                isFaceIdAvailable: false,
                isSomeAvailable: false,
                isLoading: false
            };
        }
    }

    async authenticateWithBiometrics(): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access the app',
                cancelLabel: 'Use PIN',
                disableDeviceFallback: true
            });

            return result.success;
        } catch {
            return false;
        }
    }

    async savePin(pin: string): Promise<void> {
        await expoDb.execAsync(`PRAGMA rekey = '${pin}';`);

        await SecureStore.setItemAsync(PIN_KEY, pin);
    }

    async verifyPin(pin: string): Promise<boolean> {
        const savedPin = await SecureStore.getItemAsync(PIN_KEY);

        return savedPin === pin;
    }

    async hasPinInSecureStore(): Promise<boolean> {
        const pin = await SecureStore.getItemAsync(PIN_KEY);

        return pin !== null;
    }

    async deletePin(): Promise<void> {
        await SecureStore.deleteItemAsync(PIN_KEY);
    }

    async getPin(): Promise<string | null> {
        return SecureStore.getItemAsync(PIN_KEY);
    }
}

export const authService = new AuthService();
