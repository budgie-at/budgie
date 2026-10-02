import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { SyncEntityInterface } from './sync-entity.interface';

export type SyncCreateEntityInterface = PartialByKeysType<
    Omit<SyncEntityInterface, BaseEntityKeyType>,
    | 'mode'
    | 'status'
    | 'enabled'
    | 'errorCount'
    | 'lastError'
    | 'lastWarning'
    | 'binanceTradeCursor'
    | 'forwardSyncFromAt'
    | 'forwardSyncedAt'
    | 'backwardSyncFromAt'
    | 'backwardSyncLimitAt'
    | 'backwardSyncedAt'
    | 'backwardBatchAt'
    | 'setupBalance'
    | 'balanceAdjustmentTransactionId'
    | 'transactionCount'
>;
