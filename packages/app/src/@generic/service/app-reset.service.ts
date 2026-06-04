import { Log } from '@budgie/logger';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { getErrorMessage } from '@rnw-community/shared';

import { aiCoordinatorService } from '../../ai/service/ai-coordinator.service';
import { aiEmbeddingStatusService } from '../../ai/service/ai-embedding-status.service';
import { aiSystemStatusService } from '../../ai/service/ai-system-status.service';
import { aiTranslationStatusService } from '../../ai/service/ai-translation-status.service';
import { aiUmbrellaStatusService } from '../../ai/service/ai-umbrella-status.service';
import { chatService } from '../../ai/service/chat.service';
import { embeddingDrainerService } from '../../ai/service/embedding-drainer.service';
import { embeddingService } from '../../ai/service/embedding.service';
import { sttService } from '../../ai/service/stt.service';
import { translationDrainerService } from '../../ai/service/translation-drainer.service';
import { authService } from '../../auth/service/auth.service';
import { syncWorkloadService } from '../../sync/service/sync-workload.service';
import { patternCacheService } from '../../transaction/service/pattern-cache/pattern-cache.service';
import { DB_NAME } from '../drizzle/constant/db-name.constant';
import { expoDb } from '../drizzle/db/db';
import { reloadApp } from '../utils/reload-app.util';

class AppResetService {
    private static readonly RESET_WORKLOAD_NAME = 'full-app-storage-reset';

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async clearAllDataAndRestart(): Promise<void> {
        await syncWorkloadService.run(AppResetService.RESET_WORKLOAD_NAME, () => this.clearAllAppOwnedStorage());
        await reloadApp();
    }

    private async clearAllAppOwnedStorage(): Promise<void> {
        await this.pauseLongLivedRuntime();
        await this.closeDatabase();
        this.clearDatabaseGlobals();
        this.deleteDatabaseFiles(this.getDatabasePath());
        this.deleteDatabaseFiles(`${this.getDatabasePath()}.bak`);
        this.deleteCacheContents();
        patternCacheService.invalidate();
        await authService.clearAllPins();
    }

    private async pauseLongLivedRuntime(): Promise<void> {
        await Promise.all([translationDrainerService.pause(), embeddingDrainerService.pause()]);
        aiEmbeddingStatusService.stop();
        aiTranslationStatusService.stop();
        aiUmbrellaStatusService.stop();
        aiSystemStatusService.stop();
        aiCoordinatorService.stop();
        await Promise.all([chatService.stop(), embeddingService.stop(), sttService.stop()]);
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

        cacheDirectory.list().forEach(item => {
            item.delete();
        });
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
        return `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
    }
}

export const appResetService = new AppResetService();
