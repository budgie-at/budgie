import type { SyncRecordTypeEnum } from '@budgie/contracts';

export type SyncAggregateRecordType = Exclude<SyncRecordTypeEnum, SyncRecordTypeEnum.TRANSACTION_LEG>;
