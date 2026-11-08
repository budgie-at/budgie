import type { SyncRecordDefinitionInterface } from './sync-record-definition.interface';
import type * as Schema from 'effect/Schema';

export interface SyncRecordDecoderInterface {
    readonly definition: SyncRecordDefinitionInterface;
    readonly schema: Schema.ConstraintDecoder<unknown>;
}
