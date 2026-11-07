import type { SyncRowValueType } from '../type/sync-row-value.type';
import type { SyncRowReferenceInterface } from './sync-row-reference.interface';

export interface SyncRowInterface {
    readonly tableName: string;
    readonly syncId: string;
    readonly syncZone: string;
    readonly values: Readonly<Record<string, SyncRowValueType>>;
    readonly references: readonly SyncRowReferenceInterface[];
}
