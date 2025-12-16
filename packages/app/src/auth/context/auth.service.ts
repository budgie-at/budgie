import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { db } from '../../@generic/drizzle/db/db';
import { eq } from 'drizzle-orm';
import { SettingsEntityTable } from '@budgie/contracts';

const PIN_KEY = 'user_pin';

export class AuthService {
    // Check if biometric authentication is available on device
    static async isBiometricAvailable(): Promise<boolean> {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        return compatible && enrolled;
    }

    // Get supported biometric types
    static async getBiometricTypes(): Promise<string[]> {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        return types.map(type => {
            switch (type) {
                case LocalAuthentication.AuthenticationType.FINGERPRINT:
                    return 'Fingerprint';
                case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                    return 'Face ID';
                case LocalAuthentication.AuthenticationType.IRIS:
                    return 'Iris';
                default:
                    return 'Biometric';
            }
        });
    }

    // Authenticate with biometrics
    static async authenticateWithBiometrics(): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access your account',
                cancelLabel: 'Use PIN',
                disableDeviceFallback: true
            });
            return result.success;
        } catch (error) {
            console.error('Biometric authentication error:', error);
            return false;
        }
    }

    // Save PIN securely
    static async savePin(pin: string): Promise<void> {
        await SecureStore.setItemAsync(PIN_KEY, pin);
    }

    // Verify PIN
    static async verifyPin(pin: string): Promise<boolean> {
        const savedPin = await SecureStore.getItemAsync(PIN_KEY);
        return savedPin === pin;
    }

    // Check if PIN exists in secure storage
    static async hasPinInSecureStore(): Promise<boolean> {
        const pin = await SecureStore.getItemAsync(PIN_KEY);
        return pin !== null;
    }

    // Check if PIN is enabled in settings
    static async isPinEnabled(): Promise<boolean> {
        const settings = await db.select().from(SettingsEntityTable).limit(1);
        return settings[0]?.isPinEnabled ?? false;
    }

    // Enable/disable PIN in settings
    static async setPinEnabled(enabled: boolean): Promise<void> {
        const settings = await db.select().from(SettingsEntityTable).limit(1);
        if (settings.length > 0) {
            await db.update(SettingsEntityTable).set({ isPinEnabled: enabled }).where(eq(SettingsEntityTable.id, settings[0].id));
        }
    }

    // Check if biometric is enabled in settings
    static async isBiometricEnabled(): Promise<boolean> {
        const settings = await db.select().from(SettingsEntityTable).limit(1);
        return settings[0]?.isBiometricEnabled ?? false;
    }

    // Enable/disable biometric in settings
    static async setBiometricEnabled(enabled: boolean): Promise<void> {
        const settings = await db.select().from(SettingsEntityTable).limit(1);
        if (settings.length > 0) {
            await db.update(SettingsEntityTable).set({ isBiometricEnabled: enabled }).where(eq(SettingsEntityTable.id, settings[0].id));
        }
    }

    // Clear all authentication data
    static async clearAuthData(): Promise<void> {
        await SecureStore.deleteItemAsync(PIN_KEY);
        const settings = await db.select().from(SettingsEntityTable).limit(1);
        if (settings.length > 0) {
            await db
                .update(SettingsEntityTable)
                .set({
                    isPinEnabled: false,
                    isBiometricEnabled: false
                })
                .where(eq(SettingsEntityTable.id, settings[0].id));
        }
    }
}
