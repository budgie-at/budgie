import type { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';

export interface SyncRowReferenceInterface {
    readonly column: string;
    readonly tableName: string;
    readonly kind: SyncReferenceKindEnum;
    readonly key: string;
}
