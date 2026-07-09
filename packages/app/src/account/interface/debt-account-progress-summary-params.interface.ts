import { AccountDebtTypeEnum } from '@budgie/contracts';

export interface DebtAccountProgressSummaryParamsInterface {
    readonly balance: number;
    readonly closedAmount: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly openedExtraAmount: number;
    readonly openedPrincipalAmount: number;
    readonly targetAmount: number;
}
