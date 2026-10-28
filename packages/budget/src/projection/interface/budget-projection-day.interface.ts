export interface BudgetProjectionDayInterface {
    readonly date: Date;
    readonly actual: number | null;
    readonly variableSpent: number | null;
    readonly projected: number | null;
}
