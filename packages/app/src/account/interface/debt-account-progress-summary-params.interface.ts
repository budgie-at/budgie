import { AccountDebtTypeEnum } from '@budgie/contracts';

export interface DebtAccountProgressSummaryParamsInterface {
    readonly balance: number;
    readonly creditAmount: number;
    readonly debitAmount: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly targetAmount: number;
}
