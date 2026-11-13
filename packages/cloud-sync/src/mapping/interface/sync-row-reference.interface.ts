import type { SYNC_INSTRUMENT_DEFINITION_SCHEMA } from '../constant/sync-instrument-definition-schema.constant';
import type { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';

export interface SyncRowReferenceInterface {
    readonly instrumentDefinition?: typeof SYNC_INSTRUMENT_DEFINITION_SCHEMA.Type;
    readonly column: string;
    readonly tableName: string;
    readonly kind: SyncReferenceKindEnum;
    readonly key: string;
}
