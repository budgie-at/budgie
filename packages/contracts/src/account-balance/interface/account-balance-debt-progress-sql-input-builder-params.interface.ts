import type { SQL, SQLWrapper } from 'drizzle-orm';

export interface AccountBalanceDebtProgressSqlInputBuilderParamsInterface {
    readonly accountIdReference: SQL;
    readonly baseInstrumentId: number | null;
    readonly exchangeRateSql: SQL | null;
    readonly targetAmountSql: SQL | SQLWrapper;
}
