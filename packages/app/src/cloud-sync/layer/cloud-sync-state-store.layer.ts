import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { File, Paths } from 'expo-file-system';

import { deleteIfExists } from '../../@generic/utils/delete-if-exists.util';

import type { CloudSyncStateInterface } from '@budgie/cloud-sync';

export const cloudSyncStateStoreLayer = Layer.effect(
    CloudSyncStateStore,
    Effect.sync(() => {
        const stateFile = () => new File(Paths.document, 'cloud-sync-state.json');
        const temporaryFile = () => new File(Paths.document, 'cloud-sync-state.json.tmp');
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
            const committedFile = stateFile();
            const recoveryFile = temporaryFile();
            if (committedFile.exists) {
                const committed = Schema.decodeOption(StateSchema)(committedFile.textSync());
                if (Option.isSome(committed)) {
                    return committed.value;
                }
            }
            if (recoveryFile.exists) {
                const recovered = Schema.decodeOption(StateSchema)(recoveryFile.textSync());
                if (Option.isSome(recovered)) {
                    recoveryFile.moveSync(committedFile, { overwrite: true });

                    return recovered.value;
                }
            }

            return emptyState;
        });
        const write = Effect.fnUntraced(function* (state: CloudSyncStateInterface) {
            const encodedState = yield* Schema.encodeEffect(StateSchema)(state).pipe(Effect.orDie);

            yield* Effect.sync(() => {
                const pendingFile = temporaryFile();
                pendingFile.create({ overwrite: true });
                pendingFile.writeSync(encodedState);
                pendingFile.moveSync(stateFile(), { overwrite: true });
            });
        });
        const update = (patch: Partial<CloudSyncStateInterface>) => Effect.flatMap(read, state => write({ ...state, ...patch }));

        return {
            read,
            update,
            clear: Effect.sync(() => {
                deleteIfExists(temporaryFile());
                deleteIfExists(stateFile());
            })
        };
    })
);
