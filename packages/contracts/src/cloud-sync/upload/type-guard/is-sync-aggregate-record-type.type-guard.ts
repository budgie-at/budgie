import { SyncRecordTypeEnum } from '../../mapping/enum/sync-record-type.enum';

import type { SyncAggregateRecordType } from '../../mapping/type/sync-aggregate-record-type.type';

export const isSyncAggregateRecordType = (value: string): value is SyncAggregateRecordType =>
    Object.values(SyncRecordTypeEnum).some(recordType => recordType === value && recordType !== SyncRecordTypeEnum.TRANSACTION_LEG);
