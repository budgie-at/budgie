import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankTransactionTypeEnum } from '../enum/bank-transaction-type.enum';
import type { BaseTransactionFieldsInterface } from './base-transaction-fields.interface';

export interface BankTransactionInterface extends BaseTransactionFieldsInterface {
    readonly provider: BankProviderEnum;
    readonly accountId: string;
    readonly type: BankTransactionTypeEnum;
    readonly feeAmount: number;
}
