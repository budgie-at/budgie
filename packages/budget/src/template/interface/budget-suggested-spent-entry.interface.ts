export interface BudgetSuggestedSpentEntryInterface {
    readonly amount: number;
    readonly categoryId: number | null;
    readonly instrumentId: number;
    readonly rate: number | null;
    readonly operatedAt: Date;
}
