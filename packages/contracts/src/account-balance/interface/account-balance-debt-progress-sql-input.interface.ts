import type { SQL, SQLWrapper } from 'drizzle-orm';

export interface AccountBalanceDebtProgressSqlInputInterface {
    readonly closedAmountSql: SQL;
    readonly openedAmountSql: SQL;
    readonly targetAmountSql: SQL | SQLWrapper;
}
