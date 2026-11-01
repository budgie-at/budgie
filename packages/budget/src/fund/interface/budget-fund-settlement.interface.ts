export interface BudgetFundSettlementInterface {
    readonly fundedAmount: number;
    readonly dueAt: Date;
    readonly isFinished: boolean;
}
