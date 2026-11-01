export interface BudgetFundCoveredInterface {
    readonly byCategory: ReadonlyMap<number, number>;
    readonly other: number;
}
