import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

export interface DebtAccountCardContextValueInterface {
    readonly displayPercentage: number;
    readonly instrumentSymbol: string;
    readonly settledLabel: string;
    readonly summary: DebtAccountProgressSummaryInterface;
    readonly title: string;
}
