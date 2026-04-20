/* eslint-disable lingui/no-unlocalized-strings */
import { SettingsRepository } from '@budgie/contracts';
import * as LocalAuthentication from 'expo-local-authentication';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

import { isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';
import * as schema from '../../@generic/drizzle/db/schema';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { PIN_KEY } from '../constant/pin-key.constant';

class AuthService {
    async getBiometricTypes() {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();

            if (!hasHardware) {
                return {
                    isTouchIdAvailable: false,
                    isFaceIdAvailable: false,
                    isSomeAvailable: false,
                    isLoading: false
                };
            }

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!isEnrolled) {
                return {
                    isTouchIdAvailable: false,
                    isFaceIdAvailable: false,
                    isSomeAvailable: false,
                    isLoading: false
                };
            }

            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

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

    async createPin(pin: string, isBiometricEnabled: boolean): Promise<void> {
        await this.migrateDatabase({
            nextPin: pin,
            nextSettings: {
                isBiometricEnabled,
                isPinEnabled: true
            }
        });
    }

    async changePin(pin: string): Promise<void> {
        await this.migrateDatabase({ nextPin: pin });
    }

    async verifyPin(pin: string): Promise<boolean> {
        const savedPin = await SecureStore.getItemAsync(PIN_KEY);

        return savedPin === pin;
    }

    async deletePin(): Promise<void> {
        await this.migrateDatabase({
            nextPin: null,
            nextSettings: {
                isBiometricEnabled: false,
                isPinEnabled: false
            }
        });
    }

    async getPin(): Promise<string | null> {
        return SecureStore.getItemAsync(PIN_KEY);
    }

    async clearAllPins(): Promise<void> {
        await SecureStore.deleteItemAsync(PIN_KEY);
    }

    private async migrateDatabase(params: {
        readonly nextPin: string | null;
        readonly nextSettings?: {
            readonly isBiometricEnabled: boolean;
            readonly isPinEnabled: boolean;
        };
    }): Promise<void> {
        const currentPin = await this.getPin();
        const tempDatabaseName = 'auth-migration.db';
        const tempDatabasePath = this.getTempDatabasePath(tempDatabaseName);
        const destinationPath = this.getDestinationPath();
        const backupPath = `${destinationPath}.bak`;

        await this.deleteDatabaseFiles(tempDatabasePath);
        await this.deleteDatabaseFiles(backupPath);
        await this.exportDatabase(tempDatabasePath, params.nextPin);

        try {
            if (params.nextSettings) {
                await this.updateMigratedDatabaseSettings(tempDatabaseName, params.nextPin, params.nextSettings);
            }

            await expoDb.closeAsync();
            this.clearDatabaseGlobals();
            this.deleteFileIfExists(`${destinationPath}-wal`);
            this.deleteFileIfExists(`${destinationPath}-shm`);

            const destinationFile = new File(destinationPath);
            if (destinationFile.exists) {
                destinationFile.move(new File(backupPath));
            }

            new File(tempDatabasePath).move(new File(destinationPath));

            if (isNotEmptyString(params.nextPin)) {
                await SecureStore.setItemAsync(PIN_KEY, params.nextPin);
            } else {
                await SecureStore.deleteItemAsync(PIN_KEY);
            }

            this.deleteDatabaseFiles(backupPath);
            await reloadApp();
        } catch (migrationError) {
            this.deleteFileIfExists(destinationPath);

            const backupFile = new File(backupPath);
            if (backupFile.exists) {
                backupFile.move(new File(destinationPath));
            }

            if (isNotEmptyString(currentPin)) {
                await SecureStore.setItemAsync(PIN_KEY, currentPin);
            } else {
                await SecureStore.deleteItemAsync(PIN_KEY);
            }

            throw migrationError;
        } finally {
            await this.deleteDatabaseFiles(tempDatabasePath);
            await this.deleteDatabaseFiles(backupPath);
        }
    }

    private async exportDatabase(tempDatabasePath: string, nextPin: string | null): Promise<void> {
        await expoDb.execAsync('PRAGMA wal_checkpoint(FULL)');
        await expoDb.execAsync('PRAGMA journal_mode = DELETE');
        await expoDb.execAsync(
            `ATTACH DATABASE '${this.escapeSqlString(tempDatabasePath)}' AS migrated KEY '${this.escapeSqlString(nextPin ?? '')}';`
        );

        try {
            await expoDb.execAsync(`SELECT sqlcipher_export('migrated');`);
        } finally {
            await expoDb.execAsync('DETACH DATABASE migrated;');
        }
    }

    private async updateMigratedDatabaseSettings(
        tempDatabaseName: string,
        nextPin: string | null,
        nextSettings: {
            readonly isBiometricEnabled: boolean;
            readonly isPinEnabled: boolean;
        }
    ): Promise<void> {
        const tempDatabase = await SQLite.openDatabaseAsync(tempDatabaseName, { enableChangeListener: true }, Paths.cache.uri);

        try {
            if (isNotEmptyString(nextPin)) {
                await tempDatabase.execAsync(`PRAGMA key = '${this.escapeSqlString(nextPin)}';`);
            }

            const tempSettingsRepository = new SettingsRepository(drizzle(tempDatabase, { schema }));
            await tempSettingsRepository.update(nextSettings);
        } finally {
            await tempDatabase.closeAsync();
        }
    }

    private clearDatabaseGlobals() {
        global.__expoSqliteDb__ = undefined;
        global.__drizzleDb__ = undefined;
    }

    private deleteDatabaseFiles(databasePath: string) {
        this.deleteFileIfExists(databasePath);
        this.deleteFileIfExists(`${databasePath}-wal`);
        this.deleteFileIfExists(`${databasePath}-shm`);
    }

    private deleteFileIfExists(path: string) {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private escapeSqlString(value: string) {
        return value.replaceAll("'", "''");
    }

    private getDestinationPath() {
        return `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
    }

    private getTempDatabasePath(tempDatabaseName: string) {
        return `${Paths.cache.uri}/${tempDatabaseName}`;
    }
}

export const authService = new AuthService();
