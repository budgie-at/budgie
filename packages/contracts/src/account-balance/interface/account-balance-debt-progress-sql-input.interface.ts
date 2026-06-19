import type { SQL, SQLWrapper } from 'drizzle-orm';

export interface AccountBalanceDebtProgressSqlInputInterface {
    readonly adjustmentCreditAmountSql: SQL;
    readonly adjustmentDebitAmountSql: SQL;
    readonly creditSettlementAmountSql: SQL;
    readonly debtPrimaryCreditAmountSql: SQL;
    readonly debtPrimaryDebitAmountSql: SQL;
    readonly debitSettlementAmountSql: SQL;
    readonly targetAmountSql: SQL | SQLWrapper;
}
