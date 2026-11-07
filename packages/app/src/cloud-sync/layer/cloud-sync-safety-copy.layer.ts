import { CloudSyncSafetyCopy } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { readDatabaseKey } from '../../@generic/drizzle/utils/read-database-key.util';
import { writeRestoreSafetyCopy } from '../../cloud-backup/utils/write-restore-safety-copy.util';

export const cloudSyncSafetyCopyLayer = Layer.effect(
    CloudSyncSafetyCopy,
    Effect.gen(function* () {
        const rekey = yield* DatabaseRekeyService;

        return {
            create: Effect.gen(function* () {
                const key = yield* readDatabaseKey;
                yield* writeRestoreSafetyCopy(isNotEmptyString(key) ? key : null).pipe(Effect.provideService(DatabaseRekeyService, rekey));
            })
        };
    })
).pipe(Layer.provide(DatabaseRekeyService.layer));
