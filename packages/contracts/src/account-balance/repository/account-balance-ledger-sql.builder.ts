import { sql } from 'drizzle-orm';

import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';

class AccountBalanceLedgerSqlBuilder {
    getLiveTransactionConditionSql() {
        return sql`${TransactionEntityTable.deletedAt} IS NULL AND ${TransactionEntityTable.consolidationParentTransactionId} IS NULL`;
    }

    getBalanceLedgerEntryConditionSql() {
        return sql`
            (
                ${TransactionEntryEntityTable.originalTransactionId} IS NULL
                OR ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
            )
        `;
    }
}

export const accountBalanceLedgerSqlBuilder = new AccountBalanceLedgerSqlBuilder();
