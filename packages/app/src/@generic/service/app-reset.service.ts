import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { AiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { AiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { AuthService } from '../../auth/service/auth.service';
import { PatternCacheService } from '../../transaction/service/pattern-cache/pattern-cache.service';
import { DB_NAME } from '../drizzle/constant/db-name.constant';
import { DatabaseLifecycleOperationEnum } from '../drizzle/enum/database-lifecycle-operation.enum';
import { DatabaseLifecycleService } from '../drizzle/service/database-lifecycle.service';
import { reloadApp } from '../utils/reload-app.util';

export class AppResetService extends Context.Service<AppResetService>()('@budgie/app/AppResetService', {
    make: Effect.gen(function* () {
        const aiStorageReplacementService = yield* AiStorageReplacementService;
        const aiModelResidencyService = yield* AiModelResidencyService;
        const authService = yield* AuthService;
        const patternCacheService = yield* PatternCacheService;
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const databasePath = `${SQLite.defaultDatabaseDirectory}/${DB_NAME}`;

        const deleteFileIfExists = (file: File): void => {
            if (file.exists) {
                file.delete();
            }
        };

        const deleteDatabaseFiles = (path: string): void => {
            deleteFileIfExists(new File(path));
            deleteFileIfExists(new File(`${path}-wal`));
            deleteFileIfExists(new File(`${path}-shm`));
        };

        const runAllAndFailWithFirstError = Effect.fnUntraced(function* <E, R>(steps: Effect.Effect<void, E, R>[]) {
            const exits = yield* Effect.forEach(steps, step => Effect.exit(step));
            const failure = exits.find(Exit.isFailure);

            if (isDefined(failure)) {
                yield* Effect.failCause(failure.cause);
            }
        });

        const runPrimaryResetSteps = Effect.fn('AppResetService.runPrimaryResetSteps')(function* () {
            yield* aiStorageReplacementService.pauseLongLivedRuntime();
            yield* aiModelResidencyService.suspend();
            yield* databaseLifecycleService.close();
            deleteDatabaseFiles(databasePath);
            deleteDatabaseFiles(`${databasePath}.bak`);
        });

        const deleteCacheContents = Effect.fn('AppResetService.deleteCacheContents')(function* () {
            const cacheDirectory = new Directory(Paths.cache);

            if (cacheDirectory.exists) {
                yield* runAllAndFailWithFirstError(
                    cacheDirectory.list().map(item =>
                        Effect.sync(() => {
                            item.delete();
                        })
                    )
                );
            }
        });

        return {
            clearAllDataAndRestart: Effect.fn('AppResetService.clearAllDataAndRestart')(function* () {
                yield* databaseLifecycleService.run(
                    DatabaseLifecycleOperationEnum.RESET,
                    runAllAndFailWithFirstError([
                        runPrimaryResetSteps(),
                        deleteCacheContents(),
                        Effect.sync(() => {
                            patternCacheService.invalidate();
                        }),
                        authService.persistPin(null)
                    ])
                );
                yield* Effect.promise(() => reloadApp());
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AppResetService, AppResetService.make).pipe(
        Layer.provide([
            AiStorageReplacementService.layer,
            AiModelResidencyService.layer,
            AuthService.layer,
            PatternCacheService.layer,
            DatabaseLifecycleService.layer
        ])
    );
}
