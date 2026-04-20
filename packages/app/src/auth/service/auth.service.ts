/* eslint-disable lingui/no-unlocalized-strings */
import { SettingsRepository } from '@budgie/contracts';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';
import * as schema from '../../@generic/drizzle/db/schema';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { PIN_KEY } from '../constant/pin-key.constant';

interface BiometricTypesInterface {
    readonly isFaceIdAvailable: boolean;
    readonly isLoading: boolean;
    readonly isSomeAvailable: boolean;
    readonly isTouchIdAvailable: boolean;
}

interface AuthMigrationParamsInterface {
    readonly nextPin: string | null;
    readonly nextSettings?: {
        readonly isBiometricEnabled: boolean;
        readonly isPinEnabled: boolean;
    };
}

interface AuthMigrationPathsInterface {
    readonly backupPath: string;
    readonly destinationPath: string;
    readonly tempDatabaseName: string;
    readonly tempDatabasePath: string;
}

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

    private async migrateDatabase(params: AuthMigrationParamsInterface): Promise<void> {
        const currentPin = await this.getPin();
        const migrationPaths = this.getMigrationPaths();

        try {
            await this.prepareMigrationDatabase(migrationPaths, params);
            await this.commitMigrationDatabase(migrationPaths, params.nextPin);
            await reloadApp();
        } catch (migrationError) {
            await this.rollbackMigrationDatabase(migrationPaths, currentPin);
            throw migrationError;
        } finally {
            this.deleteDatabaseFiles(migrationPaths.tempDatabasePath);
            this.deleteDatabaseFiles(migrationPaths.backupPath);
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

    private getUnavailableBiometricTypes(): BiometricTypesInterface {
        return {
            isTouchIdAvailable: false,
            isFaceIdAvailable: false,
            isSomeAvailable: false,
            isLoading: false
        };
    }

    private getMigrationPaths(): AuthMigrationPathsInterface {
        const tempDatabaseName = 'auth-migration.db';
        const destinationPath = this.getDestinationPath();

        return {
            tempDatabaseName,
            tempDatabasePath: this.getTempDatabasePath(tempDatabaseName),
            destinationPath,
            backupPath: `${destinationPath}.bak`
        };
    }

    private async prepareMigrationDatabase(paths: AuthMigrationPathsInterface, params: AuthMigrationParamsInterface): Promise<void> {
        this.deleteDatabaseFiles(paths.tempDatabasePath);
        this.deleteDatabaseFiles(paths.backupPath);
        await this.exportDatabase(paths.tempDatabasePath, params.nextPin);

        if (params.nextSettings) {
            await this.updateMigratedDatabaseSettings(paths.tempDatabaseName, params.nextPin, params.nextSettings);
        }
    }

    private async commitMigrationDatabase(paths: AuthMigrationPathsInterface, nextPin: string | null): Promise<void> {
        await expoDb.closeAsync();
        this.clearDatabaseGlobals();
        this.deleteDestinationSidecars(paths.destinationPath);
        this.moveExistingDatabaseToBackup(paths.destinationPath, paths.backupPath);
        new File(paths.tempDatabasePath).move(new File(paths.destinationPath));
        await this.persistPin(nextPin);
        this.deleteDatabaseFiles(paths.backupPath);
    }

    private async rollbackMigrationDatabase(paths: AuthMigrationPathsInterface, currentPin: string | null): Promise<void> {
        this.deleteFileIfExists(paths.destinationPath);
        this.restoreBackupDatabase(paths.backupPath, paths.destinationPath);
        await this.persistPin(currentPin);
    }

    private moveExistingDatabaseToBackup(destinationPath: string, backupPath: string): void {
        const destinationFile = new File(destinationPath);

        if (destinationFile.exists) {
            destinationFile.move(new File(backupPath));
        }
    }

    private restoreBackupDatabase(backupPath: string, destinationPath: string): void {
        const backupFile = new File(backupPath);

        if (backupFile.exists) {
            backupFile.move(new File(destinationPath));
        }
    }

    private async persistPin(pin: string | null): Promise<void> {
        if (isNotEmptyString(pin)) {
            await SecureStore.setItemAsync(PIN_KEY, pin);
        } else {
            await SecureStore.deleteItemAsync(PIN_KEY);
        }
    }

    private deleteDestinationSidecars(destinationPath: string): void {
        this.deleteFileIfExists(`${destinationPath}-wal`);
        this.deleteFileIfExists(`${destinationPath}-shm`);
    }

    private clearDatabaseGlobals() {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
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
