import { DebtSectionInterface } from './debt-section.interface';
import { HomeAccountBalanceInterface } from './home-account-balance.interface';

export interface HomeAccountBalanceSummaryInterface {
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly bankProviderTotals: ReadonlyMap<number, number>;
    readonly debtSectionTotals: ReadonlyMap<DebtSectionInterface['kind'], number>;
    readonly netWorth: number;
}
