/* eslint-disable lingui/no-unlocalized-strings */
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { databaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { RekeyParamsInterface } from '../../@generic/drizzle/service/interface/rekey-params.interface';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { PIN_KEY } from '../constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';
import { BiometricTypesInterface } from '../interface/biometric-types.interface';

class AuthService {
    async getBiometricTypes(): Promise<BiometricTypesInterface> {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();

            if (!hasHardware) {
                return this.getUnavailableBiometricTypes();
            }

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!isEnrolled) {
                return this.getUnavailableBiometricTypes();
            }

            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            const isFaceIdAvailable = types.some(type => type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
            const isTouchIdAvailable = types.some(type => type === LocalAuthentication.AuthenticationType.FINGERPRINT);

            return {
                isSomeAvailable: isFaceIdAvailable || isTouchIdAvailable,
                isTouchIdAvailable,
                isFaceIdAvailable,
                isLoading: false
            };
        } catch {
            return this.getUnavailableBiometricTypes();
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

    async createPin(pin: string, isBiometricEnabled: boolean): Promise<void> {
        await this.rekeyDatabase({
            nextKey: pin,
            nextSettings: {
                isBiometricEnabled,
                isPinEnabled: true
            }
        });
    }

    async changePin(pin: string): Promise<void> {
        await this.rekeyDatabase({ nextKey: pin });
    }

    async verifyPin(pin: string): Promise<boolean> {
        const savedPin = await SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS);

        return savedPin === pin;
    }

    async deletePin(): Promise<void> {
        await this.rekeyDatabase({
            nextKey: null,
            nextSettings: {
                isBiometricEnabled: false,
                isPinEnabled: false
            }
        });
    }

    async getPin(): Promise<string | null> {
        return SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS);
    }

    async clearAllPins(): Promise<void> {
        await SecureStore.deleteItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS);
    }

    async ensurePinBackgroundAccessibility(): Promise<void> {
        const pin = await this.getPin();

        if (isNotEmptyString(pin)) {
            await this.persistPin(pin);
        }
    }

    private async rekeyDatabase(params: RekeyParamsInterface): Promise<void> {
        const previousPin = await this.getPin();

        try {
            await databaseRekeyService.rekey(params, () => this.persistPin(params.nextKey));
            await reloadApp();
        } catch (error) {
            await this.persistPin(previousPin);
            throw error;
        }
    }

    private async persistPin(pin: string | null): Promise<void> {
        if (isNotEmptyString(pin)) {
            await SecureStore.setItemAsync(PIN_KEY, pin, PIN_SECURE_STORE_OPTIONS);
        } else {
            await SecureStore.deleteItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS);
        }
    }

    private getUnavailableBiometricTypes(): BiometricTypesInterface {
        return {
            isTouchIdAvailable: false,
            isFaceIdAvailable: false,
            isSomeAvailable: false,
            isLoading: false
        };
    }
}

export const authService = new AuthService();
