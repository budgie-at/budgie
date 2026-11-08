import type { SyncAggregateRecordType } from '../type/sync-aggregate-record-type.type';
import type { SyncRowInputType } from '../type/sync-row-input.type';

export interface SyncAggregateInterface {
    readonly recordType: SyncAggregateRecordType;
    readonly parent: SyncRowInputType;
    readonly children: Readonly<Record<string, readonly SyncRowInputType[]>>;
}
