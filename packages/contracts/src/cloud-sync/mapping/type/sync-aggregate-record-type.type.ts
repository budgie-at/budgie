import type { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';

export type SyncAggregateRecordType = Exclude<SyncRecordTypeEnum, SyncRecordTypeEnum.TRANSACTION_LEG>;
