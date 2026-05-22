import { Log } from '@budgie/logger';
import { File, Paths } from 'expo-file-system';

import { getErrorMessage } from '@rnw-community/shared';

import { clearDatabaseGlobals, opSqliteDb } from '../../@generic/drizzle/db/db';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { aiCoordinatorService } from '../../ai/service/ai-coordinator.service';
import { aiEmbeddingStatusService } from '../../ai/service/ai-embedding-status.service';
import { aiSystemStatusService } from '../../ai/service/ai-system-status.service';
import { aiTranslationStatusService } from '../../ai/service/ai-translation-status.service';
import { aiUmbrellaStatusService } from '../../ai/service/ai-umbrella-status.service';
import { embeddingDrainerService } from '../../ai/service/embedding-drainer.service';
import { translationDrainerService } from '../../ai/service/translation-drainer.service';
import { authService } from '../../auth/service/auth.service';

class DatabaseImportService {
    @Log(
        sourceUri => `enter sourceUri="${sourceUri}"`,
        (result, sourceUri) => `done result=${String(result)} sourceUri="${sourceUri}"`,
        (error, sourceUri) => `throw sourceUri="${sourceUri}" error=${getErrorMessage(error)}`
    )
    async importFromUri(sourceUri: string): Promise<void> {
        await this.replaceFromUri(sourceUri);
        await authService.clearAllPins();
        await reloadApp();
    }

    async replaceFromUri(sourceUri: string): Promise<void> {
        const destinationPath = this.getDestinationPath();
        const tempPath = `${Paths.cache.uri}/import-temp.db`;

        await this.pauseLongLivedRuntime();
        await opSqliteDb.closeAsync();
        this.clearDatabaseGlobals();
        this.deleteDestinationFiles(destinationPath, tempPath);
        this.replaceDestinationFile(sourceUri, tempPath, destinationPath);
        this.copyDatabaseSidecars(sourceUri, destinationPath);
    }

    private replaceDestinationFile(sourceUri: string, tempPath: string, destinationPath: string): void {
        const tempFile = new File(tempPath);
        new File(sourceUri).copy(tempFile);
        tempFile.move(new File(destinationPath));
    }

    private async pauseLongLivedRuntime(): Promise<void> {
        await Promise.all([translationDrainerService.pause(), embeddingDrainerService.pause()]);
        aiEmbeddingStatusService.stop();
        aiTranslationStatusService.stop();
        aiUmbrellaStatusService.stop();
        aiSystemStatusService.stop();
        aiCoordinatorService.stop();
    }

    private copyDatabaseSidecars(sourceUri: string, destinationPath: string): void {
        this.copyFileIfExists(`${sourceUri}-wal`, `${destinationPath}-wal`);
        this.copyFileIfExists(`${sourceUri}-shm`, `${destinationPath}-shm`);
    }

    private deleteDestinationFiles(destinationPath: string, tempPath: string): void {
        [destinationPath, `${destinationPath}-wal`, `${destinationPath}-shm`, tempPath].forEach(path => void this.deleteFileIfExists(path));
    }

    private clearDatabaseGlobals() {
        clearDatabaseGlobals();
    }

    private deleteFileIfExists(path: string) {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private copyFileIfExists(sourcePath: string, destinationPath: string) {
        const sourceFile = new File(sourcePath);

        if (sourceFile.exists) {
            sourceFile.copy(new File(destinationPath));
        }
    }

    private getDestinationPath() {
        return opSqliteDb.getDbPath();
    }
}

export const databaseImportService = new DatabaseImportService();
