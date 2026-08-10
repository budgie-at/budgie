import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';

import { HomeAccountBalanceInterface } from './home-account-balance.interface';

export interface HomeAccountBalanceSummaryInterface {
    readonly accountTypeTotals: ReadonlyMap<AccountTypeEnum, number>;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly bankProviderTotals: ReadonlyMap<number, number>;
    readonly cryptoCount: number;
    readonly cryptoTotal: number;
    readonly debtTypeTotals: ReadonlyMap<AccountDebtTypeEnum, number>;
    readonly fiatCount: number;
    readonly fiatTotal: number;
    readonly netWorth: number;
}
