import type { SQL } from 'drizzle-orm';

export interface AccountBalanceDebtProgressComputedSqlInputInterface {
    readonly closedMovementAmountSql: SQL<number>;
    readonly initialBalanceAmountSql: SQL<number>;
    readonly initialClosedAmountSql: SQL<number>;
    readonly initialOutstandingAmountSql: SQL<number>;
    readonly openedExtraAmountSql: SQL<number>;
    readonly openedPrincipalAmountSql: SQL<number>;
    readonly targetAmountSql: SQL<number>;
}
