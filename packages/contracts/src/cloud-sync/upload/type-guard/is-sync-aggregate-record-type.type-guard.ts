import { SyncRecordTypeEnum } from '../../mapping/enum/sync-record-type.enum';

import type { SyncAggregateRecordType } from '../../mapping/type/sync-aggregate-record-type.type';

const AGGREGATE_RECORD_TYPES = new Set<string>(
    Object.values(SyncRecordTypeEnum).filter(recordType => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG)
);

export const isSyncAggregateRecordType = (value: string): value is SyncAggregateRecordType => AGGREGATE_RECORD_TYPES.has(value);
