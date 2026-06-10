import type { BaseTransactionFieldsInterface } from './base-transaction-fields.interface';
import type { SyncProviderEnum } from '../enum/sync-provider.enum';
import type { SyncTransactionTypeEnum } from '../enum/sync-transaction-type.enum';

export interface SyncTransactionInterface extends BaseTransactionFieldsInterface {
    readonly provider: SyncProviderEnum;
    readonly accountId: string;
    readonly type: SyncTransactionTypeEnum;
    readonly feeAmount: number;
}
