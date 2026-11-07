import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { File, Paths } from 'expo-file-system';

import type { CloudSyncStateInterface } from '@budgie/cloud-sync';

export const cloudSyncStateStoreLayer = Layer.effect(
    CloudSyncStateStore,
    Effect.sync(() => {
        const stateFile = new File(Paths.document, 'cloud-sync-state.json');
        const NullableString = Schema.String.pipe(Schema.NullOr);
        const StateSchema = Schema.fromJsonString(
            Schema.Struct({
                boundUserRecordName: NullableString,
                stateSerialization: NullableString,
                sharedStateSerialization: NullableString,
                resolvedLineageId: NullableString,
                restorePhase: Schema.Enum(CloudSyncRestorePhaseEnum),
                isHouseholdCleanupPending: Schema.Boolean,
                householdOwnerDisplayName: NullableString
            })
        );
        const emptyState: CloudSyncStateInterface = {
            boundUserRecordName: null,
            stateSerialization: null,
            sharedStateSerialization: null,
            resolvedLineageId: null,
            restorePhase: CloudSyncRestorePhaseEnum.NONE,
            isHouseholdCleanupPending: false,
            householdOwnerDisplayName: null
        };

        const read = Effect.sync(() =>
            stateFile.exists
                ? Option.match(Schema.decodeOption(StateSchema)(stateFile.textSync()), {
                      onNone: () => emptyState,
                      onSome: state => state
                  })
                : emptyState
        );
        const write = Effect.fnUntraced(function* (state: CloudSyncStateInterface) {
            const encodedState = yield* Schema.encodeEffect(StateSchema)(state).pipe(Effect.orDie);

            yield* Effect.sync(() => {
                const temporaryFile = new File(Paths.document, 'cloud-sync-state.json.tmp');

                temporaryFile.create({ overwrite: true });
                temporaryFile.writeSync(encodedState);
            });
            yield* Effect.promise(() => new File(Paths.document, 'cloud-sync-state.json.tmp').move(stateFile));
        });
        const update = (patch: Partial<CloudSyncStateInterface>) => Effect.flatMap(read, state => write({ ...state, ...patch }));

        return {
            read,
            update,
            clear: Effect.sync(() => {
                if (stateFile.exists) {
                    stateFile.delete();
                }
            })
        };
    })
);
