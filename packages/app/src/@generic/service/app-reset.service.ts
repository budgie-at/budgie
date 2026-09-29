import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { aiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { aiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { authService } from '../../auth/service/auth.service';
import { patternCacheService } from '../../transaction/service/pattern-cache/pattern-cache.service';
import { DB_NAME } from '../drizzle/constant/db-name.constant';
import { DatabaseLifecycleOperationEnum } from '../drizzle/enum/database-lifecycle-operation.enum';
import { databaseLifecycleService } from '../drizzle/service/database-lifecycle.service';
import { reloadApp } from '../utils/reload-app.util';

class AppResetService {
    readonly clearAllDataAndRestart = Effect.fn('AppResetService.clearAllDataAndRestart')(function* (this: AppResetService) {
        yield* databaseLifecycleService.run(
            DatabaseLifecycleOperationEnum.RESET,
            this.runAllAndFailWithFirstError([
                this.runPrimaryResetSteps(),
                this.deleteCacheContents(),
                Effect.sync(() => {
                    patternCacheService.invalidate();
                }),
                authService.persistPin(null)
            ])
        );
        yield* Effect.promise(() => reloadApp());
    });

    private readonly runPrimaryResetSteps = Effect.fn('AppResetService.runPrimaryResetSteps')(function* (this: AppResetService) {
        yield* aiStorageReplacementService.pauseLongLivedRuntime();
        yield* aiModelResidencyService.suspend();
        yield* databaseLifecycleService.close();
        this.deleteDatabaseFiles(this.getDatabasePath());
        this.deleteDatabaseFiles(`${this.getDatabasePath()}.bak`);
    });

    private readonly deleteCacheContents = Effect.fn('AppResetService.deleteCacheContents')(function* (this: AppResetService) {
        const cacheDirectory = new Directory(Paths.cache);

        if (cacheDirectory.exists) {
            yield* this.runAllAndFailWithFirstError(
                cacheDirectory.list().map(item =>
                    Effect.sync(() => {
                        item.delete();
                    })
                )
            );
        }
    });

    private readonly runAllAndFailWithFirstError = Effect.fnUntraced(function* <E, R>(steps: Effect.Effect<void, E, R>[]) {
        const exits = yield* Effect.forEach(steps, step => Effect.exit(step));
        const failure = exits.find(Exit.isFailure);

        if (isDefined(failure)) {
            yield* Effect.failCause(failure.cause);
        }
    });

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
