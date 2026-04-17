/* eslint-disable lingui/no-unlocalized-strings */
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { expoDb } from '../../@generic/drizzle/db/db';
import { PIN_KEY } from '../constant/pin-key.constant';

class AuthService {
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
        const oldPin = await this.getPin();
        await SecureStore.setItemAsync(PIN_KEY, pin);

        if (isNotEmptyString(oldPin)) {
            await expoDb.execAsync(`PRAGMA rekey = '${pin}';`);
        } else {
            await expoDb.execAsync(`PRAGMA key = '${pin}';`);
        }
    }

    async verifyPin(pin: string): Promise<boolean> {
        const savedPin = await SecureStore.getItemAsync(PIN_KEY);

        return savedPin === pin;
    }

    async deletePin(): Promise<void> {
        await SecureStore.deleteItemAsync(PIN_KEY);
    }

    async getPin(): Promise<string | null> {
        return SecureStore.getItemAsync(PIN_KEY);
    }

    async clearAllPins(): Promise<void> {
        await SecureStore.deleteItemAsync(PIN_KEY);
    }
}

export const authService = new AuthService();
