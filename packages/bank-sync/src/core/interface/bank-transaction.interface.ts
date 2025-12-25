import type { BaseTransactionFieldsInterface } from './base-transaction-fields.interface';
import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankTransactionTypeEnum } from '../enum/bank-transaction-type.enum';

export interface BankTransactionInterface extends BaseTransactionFieldsInterface {
    readonly provider: BankProviderEnum;
    readonly accountId: string;
    readonly type: BankTransactionTypeEnum;
}
