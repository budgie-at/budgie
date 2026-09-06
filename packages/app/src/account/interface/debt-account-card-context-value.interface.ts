import type { AccountDebtTypeEnum, DebtAccountProgressSummaryInterface } from '@budgie/contracts';

export interface DebtAccountCardContextValueInterface {
    readonly debtType: AccountDebtTypeEnum;
    readonly displayPercentage: number;
    readonly instrumentSymbol: string;
    readonly settledLabel: string;
    readonly summary: DebtAccountProgressSummaryInterface;
    readonly title: string;
}
