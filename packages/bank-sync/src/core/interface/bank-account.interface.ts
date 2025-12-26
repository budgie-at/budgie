import type { BankAccountTypeEnum } from '../enum/bank-account-type.enum';
import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { CashbackTypeEnum } from '../enum/cashback-type.enum';

export interface BankAccountInterface {
    readonly id: string;
    readonly provider: BankProviderEnum;
    readonly currencyCode: string;
    readonly currencyCodeNumeric: number;
    readonly balance: number;
    readonly creditLimit: number;
    readonly type: BankAccountTypeEnum;
    readonly iban?: string;
    readonly maskedPan?: string[];
    readonly cashbackType?: CashbackTypeEnum;
}
