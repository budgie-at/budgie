import type { BaseTransactionFieldsInterface } from './base-transaction-fields.interface';
import type { BankTransactionTypeEnum } from '../enum/bank-transaction-type.enum';
import type { SyncProviderEnum } from '../enum/sync-provider.enum';

export interface BankTransactionInterface extends BaseTransactionFieldsInterface {
    readonly provider: SyncProviderEnum;
    readonly accountId: string;
    readonly type: BankTransactionTypeEnum;
    readonly feeAmount: number;
}
