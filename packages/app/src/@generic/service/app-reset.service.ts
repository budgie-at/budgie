import { Log } from '@budgie/logger';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { aiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { chatService } from '../../ai/service/chat.service';
import { embeddingService } from '../../ai/service/embedding.service';
import { sttService } from '../../ai/service/stt.service';
import { authService } from '../../auth/service/auth.service';
import { patternCacheService } from '../../transaction/service/pattern-cache/pattern-cache.service';
import { DB_NAME } from '../drizzle/constant/db-name.constant';
import { expoDb } from '../drizzle/db/db';
import { reloadApp } from '../utils/reload-app.util';

import { foregroundWorkloadService } from './foreground-workload.service';

class AppResetService {
    private static readonly RUNTIME_TEARDOWN_TIMEOUT_MS = 10_000;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async clearAllDataAndRestart(): Promise<void> {
        await foregroundWorkloadService.run(() => this.clearAllAppOwnedStorage());
        await reloadApp();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async tearDownRuntime(): Promise<void> {
        await aiStorageReplacementService.pauseLongLivedRuntime();
        await Promise.all([chatService.stop(), embeddingService.stop(), sttService.stop()]);
        await this.closeDatabase();
    }

    private async clearAllAppOwnedStorage(): Promise<void> {
        const errors: unknown[] = [];

        await this.runPrimaryResetSteps(errors);
        await this.runCleanupResetSteps(errors);

        if (isNotEmptyArray(errors)) {
            throw errors[0];
        }
    }

    private async runPrimaryResetSteps(errors: unknown[]): Promise<void> {
        await this.tearDownRuntimeBestEffort();
        try {
            this.clearDatabaseGlobals();
            this.deleteDatabaseFiles(this.getDatabasePath());
            this.deleteDatabaseFiles(`${this.getDatabasePath()}.bak`);
        } catch (error: unknown) {
            errors.push(error);
        }
    }

    private async runCleanupResetSteps(errors: unknown[]): Promise<void> {
        this.captureSyncError(() => void this.deleteCacheContents(), errors);
        this.captureSyncError(() => void patternCacheService.invalidate(), errors);
        await this.captureAsyncError(() => authService.clearAllPins(), errors);
    }

    private async tearDownRuntimeBestEffort(): Promise<void> {
        let deadlineTimer: ReturnType<typeof setTimeout> | null = null;
        const deadline = new Promise<void>(resolve => {
            deadlineTimer = setTimeout(resolve, AppResetService.RUNTIME_TEARDOWN_TIMEOUT_MS);
        });

        try {
            await Promise.race([this.tearDownRuntime().catch(emptyFn), deadline]);
        } finally {
            if (isDefined(deadlineTimer)) {
                clearTimeout(deadlineTimer);
            }
        }
    }

    private captureSyncError(operation: () => void, errors: unknown[]): void {
        try {
            operation();
        } catch (error: unknown) {
            errors.push(error);
        }
    }

    private async captureAsyncError(operation: () => Promise<void>, errors: unknown[]): Promise<void> {
        try {
            await operation();
        } catch (error: unknown) {
            errors.push(error);
        }
    }

    private async closeDatabase(): Promise<void> {
        await expoDb.closeAsync();
    }

    private clearDatabaseGlobals(): void {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;
    }

    private deleteCacheContents(): void {
        const cacheDirectory = new Directory(Paths.cache);

        if (!cacheDirectory.exists) {
            return;
        }

        let firstError: unknown = null;

        cacheDirectory.list().forEach(item => {
            try {
                item.delete();
            } catch (error: unknown) {
                if (!isDefined(firstError)) {
                    firstError = error;
                }
            }
        });

        if (isDefined(firstError)) {
            throw firstError;
        }
    }

    private deleteDatabaseFiles(databasePath: string): void {
        this.deleteFileIfExists(new File(databasePath));
        this.deleteFileIfExists(new File(`${databasePath}-wal`));
        this.deleteFileIfExists(new File(`${databasePath}-shm`));
    }

    private deleteFileIfExists(file: File): void {
        if (file.exists) {
            file.delete();
        }
    }

    private getDatabasePath(): string {
        return `${SQLite.defaultDatabaseDirectory}/${DB_NAME}`;
    }
}

export const appResetService = new AppResetService();
