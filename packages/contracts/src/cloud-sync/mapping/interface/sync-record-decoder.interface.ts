import type * as Schema from 'effect/Schema';

import type { SyncRecordDefinitionInterface } from './sync-record-definition.interface';

export interface SyncRecordDecoderInterface {
    readonly definition: SyncRecordDefinitionInterface;
    readonly schema: Schema.Constraint;
}
