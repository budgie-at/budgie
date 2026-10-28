export interface BudgetProjectionDayInterface {
    readonly date: Date;
    readonly actual: number | null;
    readonly projected: number | null;
}
