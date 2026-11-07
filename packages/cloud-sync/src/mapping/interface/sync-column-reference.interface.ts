import type { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';

export interface SyncColumnReferenceInterface {
    readonly tableName: string;
    readonly kind: SyncReferenceKindEnum;
}
