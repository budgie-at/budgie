import { SQL, and, eq, isNull, sql } from 'drizzle-orm';

import { DB } from '../../@generic/type/db.type';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export class TransactionRuleRepository {
    constructor(private db: DB) {}

    async countByRuleConditions(where: SQL): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(and(isNull(TransactionEntityTable.deletedAt), where));

        return result[0]?.count ?? 0;
    }

    async findIdsByRuleConditions(where: SQL): Promise<number[]> {
        const result = await this.db
            .selectDistinct({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(and(isNull(TransactionEntityTable.deletedAt), where));

        return result.map(row => row.id);
    }

    buildApplyStatusQuery(matchedWhere: SQL, appliedWhere: SQL) {
        return this.db
            .select({
                matched: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})`,
                applied: sql<number>`COUNT(DISTINCT CASE WHEN ${appliedWhere} THEN ${TransactionEntityTable.id} END)`
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(and(isNull(TransactionEntityTable.deletedAt), matchedWhere));
    }
}
