import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File } from 'expo-file-system';

import { isNotEmptyString } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DATABASE_LOCATION } from '../../@generic/drizzle/constant/database-location.constant';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { readDatabaseKey } from '../../@generic/drizzle/utils/read-database-key.util';

export class CloudSyncSafetyCopyService extends Context.Service<CloudSyncSafetyCopyService>()('@budgie/app/CloudSyncSafetyCopyService', {
    make: Effect.gen(function* () {
        const databaseRekeyService = yield* DatabaseRekeyService;
        const safetyCopyName = 'cloud-sync-safety.db';

        return {
            create: Effect.fn('CloudSyncSafetyCopyService.create')(function* () {
                const key = yield* readDatabaseKey;
                const safetyFile = new File(DATABASE_DIRECTORY, safetyCopyName);

                if (safetyFile.exists) {
                    safetyFile.delete();
                }

                yield* databaseRekeyService.exportEncryptedCopy(
                    `${DATABASE_LOCATION}/${safetyCopyName}`,
                    isNotEmptyString(key) ? key : null
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncSafetyCopyService, CloudSyncSafetyCopyService.make).pipe(
        Layer.provide(DatabaseRekeyService.layer)
    );
}
