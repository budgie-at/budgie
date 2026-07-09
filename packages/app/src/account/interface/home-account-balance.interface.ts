import { AccountDebtTypeEnum, AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import type { DebtAccountProgressSummaryInterface } from './debt-account-progress-summary.interface';

export interface HomeAccountBalanceInterface {
    readonly accountId: number;
    readonly accountType: AccountTypeEnum;
    readonly balance: number;
    readonly bankProvider: ExternalSourceEnum | null;
    readonly convertedBalance: number;
    readonly convertedCreditAmount: number;
    readonly convertedDebitAmount: number;
    readonly convertedDebtProgressSummary: DebtAccountProgressSummaryInterface;
    readonly convertedTargetBalance: number;
    readonly debtProgressSummary: DebtAccountProgressSummaryInterface;
    readonly debtType: AccountDebtTypeEnum;
    readonly includeInNetWorth: boolean;
    readonly isActive: boolean;
}
