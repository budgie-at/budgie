import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { File, Paths } from 'expo-file-system';

import { CloudSyncRestorePhaseEnum } from '../enum/cloud-sync-restore-phase.enum';

import type { CloudSyncStateInterface } from '../interface/cloud-sync-state.interface';

export class CloudSyncStateStore extends Context.Service<CloudSyncStateStore>()('@budgie/app/CloudSyncStateStore', {
    make: Effect.sync(() => {
        const stateFile = new File(Paths.document, 'cloud-sync-state.json');
        const NullableString = Schema.String.pipe(Schema.NullOr);
        const StateSchema = Schema.fromJsonString(
            Schema.Struct({
                boundUserRecordName: NullableString,
                stateSerialization: NullableString,
                sharedStateSerialization: Schema.optionalKey(NullableString),
                resolvedLineageId: NullableString,
                restorePhase: Schema.Enum(CloudSyncRestorePhaseEnum),
                isHouseholdCleanupPending: Schema.optionalKey(Schema.Boolean),
                householdOwnerDisplayName: Schema.optionalKey(NullableString)
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
                      onSome: state => ({
                          ...state,
                          sharedStateSerialization: state.sharedStateSerialization ?? null,
                          isHouseholdCleanupPending: state.isHouseholdCleanupPending ?? false,
                          householdOwnerDisplayName: state.householdOwnerDisplayName ?? null
                      })
                  })
                : emptyState
        );
        const write = Effect.fnUntraced(function* (state: CloudSyncStateInterface) {
            const encodedState = yield* Schema.encodeEffect(StateSchema)(state).pipe(Effect.orDie);

            yield* Effect.sync(() => {
                stateFile.create({ overwrite: true });
                stateFile.writeSync(encodedState);
            });
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
}) {
    static readonly layer = Layer.effect(CloudSyncStateStore, CloudSyncStateStore.make);
}
