import { AccountTypeEnum } from '@budgie/contracts';

import { DebtSectionInterface } from './debt-section.interface';
import { HomeAccountBalanceInterface } from './home-account-balance.interface';

export interface HomeAccountBalanceSummaryInterface {
    readonly accountTypeTotals: ReadonlyMap<AccountTypeEnum, number>;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly bankProviderTotals: ReadonlyMap<number, number>;
    readonly cryptoCount: number;
    readonly cryptoTotal: number;
    readonly debtSectionTotals: ReadonlyMap<DebtSectionInterface['kind'], number>;
    readonly fiatCount: number;
    readonly fiatTotal: number;
    readonly netWorth: number;
}
