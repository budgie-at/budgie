import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankTransactionTypeEnum } from '../enum/bank-transaction-type.enum';

export interface BankTransactionInterface {
    readonly id: string;
    readonly provider: BankProviderEnum;
    readonly accountId: string;
    readonly time: number;
    readonly description: string;
    readonly mcc: number;
    readonly originalMcc: number;
    readonly amount: number;
    readonly operationAmount: number;
    readonly currencyCode: number;
    readonly commissionRate: number;
    readonly cashbackAmount: number;
    readonly balance: number;
    readonly hold: boolean;
    readonly type: BankTransactionTypeEnum;
    readonly receiptId?: string;
    readonly invoiceId?: string;
    readonly counterEdrpou?: string;
    readonly counterIban?: string;
    readonly counterName?: string;
    readonly comment?: string;
}
