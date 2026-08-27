import type { CashbackTypeEnum } from '../enum/cashback-type.enum';
import type { SyncAccountBalanceStateEnum } from '../enum/sync-account-balance-state.enum';
import type { SyncAccountTypeEnum } from '../enum/sync-account-type.enum';
import type { SyncProviderEnum } from '../enum/sync-provider.enum';

export interface SyncAccountInterface {
    readonly id: string;
    readonly provider: SyncProviderEnum;
    readonly currencyCode: string;
    readonly currencyCodeNumeric: number;
    readonly balance: number;
    readonly balanceState: SyncAccountBalanceStateEnum;
    readonly creditLimit: number;
    readonly type: SyncAccountTypeEnum;
    readonly title?: string;
    readonly iban?: string;
    readonly maskedPan?: string[];
    readonly cashbackType?: CashbackTypeEnum;
}
