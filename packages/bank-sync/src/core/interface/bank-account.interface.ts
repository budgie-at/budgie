import type { BankAccountTypeEnum } from '../enum/bank-account-type.enum';
import type { CashbackTypeEnum } from '../enum/cashback-type.enum';
import type { SyncProviderEnum } from '../enum/sync-provider.enum';

export interface BankAccountInterface {
    readonly id: string;
    readonly provider: SyncProviderEnum;
    readonly currencyCode: string;
    readonly currencyCodeNumeric: number;
    readonly balance: number;
    readonly creditLimit: number;
    readonly type: BankAccountTypeEnum;
    readonly title?: string;
    readonly iban?: string;
    readonly maskedPan?: string[];
    readonly cashbackType?: CashbackTypeEnum;
}
