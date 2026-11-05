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
        const StateSchema = Schema.fromJsonString(
            Schema.Struct({
                boundUserRecordName: Schema.NullOr(Schema.String),
                stateSerialization: Schema.NullOr(Schema.String),
                sharedStateSerialization: Schema.optionalKey(Schema.NullOr(Schema.String)),
                resolvedLineageId: Schema.NullOr(Schema.String),
                restorePhase: Schema.Enum(CloudSyncRestorePhaseEnum)
            })
        );
        const emptyState: CloudSyncStateInterface = {
            boundUserRecordName: null,
            stateSerialization: null,
            sharedStateSerialization: null,
            resolvedLineageId: null,
            restorePhase: CloudSyncRestorePhaseEnum.NONE
        };

        const read = Effect.sync(() =>
            stateFile.exists
                ? Option.match(Schema.decodeUnknownOption(StateSchema)(stateFile.textSync()), {
                      onNone: () => emptyState,
                      onSome: state => ({ ...state, sharedStateSerialization: state.sharedStateSerialization ?? null })
                  })
                : emptyState
        );
        const write = (state: CloudSyncStateInterface) =>
            Effect.sync(() => {
                stateFile.create({ overwrite: true });
                stateFile.writeSync(Schema.encodeSync(StateSchema)(state));
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
