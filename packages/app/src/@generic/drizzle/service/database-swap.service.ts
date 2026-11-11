import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as SecureStore from 'expo-secure-store';

import { PIN_SECURE_STORE_OPTIONS } from '../../../auth/constant/pin-secure-store-options.constant';
import { cloudSyncStateStoreLayer } from '../../../cloud-sync/layer/cloud-sync-state-store.layer';
import { persistDatabaseKey } from '../utils/persist-database-key.util';

export class DatabaseSwapService extends Context.Service<DatabaseSwapService>()('@budgie/app/DatabaseSwapService', {
    make: Effect.gen(function* () {
        const cloudSyncStateStore = yield* CloudSyncStateStore;
        const swapKey = 'database_swap';
        const DatabaseSwapSchema = Schema.Struct({
            key: Schema.NullOr(Schema.String),
            backupName: Schema.String,
            isImport: Schema.Boolean
        });
        const DatabaseSwapJsonSchema = Schema.fromJsonString(DatabaseSwapSchema);

        return {
            read: Effect.promise(() => SecureStore.getItemAsync(swapKey, PIN_SECURE_STORE_OPTIONS)).pipe(
                Effect.map(value => Option.flatMap(Option.fromNullOr(value), Schema.decodeOption(DatabaseSwapJsonSchema)))
            ),
            begin: Effect.fn('DatabaseSwapService.begin')(function* (swap: typeof DatabaseSwapSchema.Type) {
                const encodedSwap = yield* Schema.encodeEffect(DatabaseSwapJsonSchema)(swap).pipe(Effect.orDie);

                yield* Effect.promise(() => SecureStore.setItemAsync(swapKey, encodedSwap, PIN_SECURE_STORE_OPTIONS));
            }),
            commit: Effect.fn('DatabaseSwapService.commit')(function* (swap: typeof DatabaseSwapSchema.Type) {
                yield* persistDatabaseKey(swap.key);

                if (swap.isImport) {
                    yield* cloudSyncStateStore.update({
                        stateSerialization: null,
                        resolvedLineageId: null,
                        restorePhase: CloudSyncRestorePhaseEnum.PENDING
                    });
                }
            }),
            end: Effect.promise(() => SecureStore.deleteItemAsync(swapKey, PIN_SECURE_STORE_OPTIONS))
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseSwapService, DatabaseSwapService.make).pipe(Layer.provide(cloudSyncStateStoreLayer));
}
