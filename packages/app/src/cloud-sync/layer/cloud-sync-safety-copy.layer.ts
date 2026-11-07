import { CloudSyncSafetyCopy } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Str from 'effect/String';
import { File } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DATABASE_LOCATION } from '../../@generic/drizzle/constant/database-location.constant';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { readDatabaseKey } from '../../@generic/drizzle/utils/read-database-key.util';
import { RESTORE_SAFETY_FILES } from '../../cloud-backup/constant/restore-safety-files.constant';

export const cloudSyncSafetyCopyLayer = Layer.effect(
    CloudSyncSafetyCopy,
    Effect.gen(function* () {
        const databaseRekeyService = yield* DatabaseRekeyService;
        const safetyCopyName = RESTORE_SAFETY_FILES.copy;

        return {
            create: Effect.gen(function* () {
                const key = yield* readDatabaseKey;
                const safetyFile = new File(DATABASE_DIRECTORY, safetyCopyName);

                if (safetyFile.exists) {
                    safetyFile.delete();
                }

                yield* databaseRekeyService.exportEncryptedCopy(
                    `${DATABASE_LOCATION}/${safetyCopyName}`,
                    isDefined(key) && Str.isNonEmpty(key) ? key : null
                );
            })
        };
    })
).pipe(Layer.provide(DatabaseRekeyService.layer));
