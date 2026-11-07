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
        const temporaryFile = new File(Paths.document, 'cloud-sync-state.json.tmp');
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

        const read = Effect.sync(() => {
            if (stateFile.exists) {
                const committed = Schema.decodeOption(StateSchema)(stateFile.textSync());
                if (Option.isSome(committed)) {
                    return committed.value;
                }
            }
            if (temporaryFile.exists) {
                const recovered = Schema.decodeOption(StateSchema)(temporaryFile.textSync());
                if (Option.isSome(recovered)) {
                    temporaryFile.moveSync(stateFile, { overwrite: true });

                    return recovered.value;
                }
            }

            return emptyState;
        });
        const write = Effect.fnUntraced(function* (state: CloudSyncStateInterface) {
            const encodedState = yield* Schema.encodeEffect(StateSchema)(state).pipe(Effect.orDie);

            yield* Effect.sync(() => {
                temporaryFile.create({ overwrite: true });
                temporaryFile.writeSync(encodedState);
                temporaryFile.moveSync(stateFile, { overwrite: true });
            });
        });
        const update = (patch: Partial<CloudSyncStateInterface>) => Effect.flatMap(read, state => write({ ...state, ...patch }));

        return {
            read,
            update,
            clear: Effect.sync(() => {
                if (temporaryFile.exists) {
                    temporaryFile.delete();
                }
                if (stateFile.exists) {
                    stateFile.delete();
                }
            })
        };
    })
);
