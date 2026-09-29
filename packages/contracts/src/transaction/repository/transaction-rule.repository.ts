import { SQL, and, eq, inArray, isNull, ne, sql } from 'drizzle-orm';

import { DB } from '../../@generic/type/db.type';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export class TransactionRuleRepository {
    constructor(private db: DB) {}

    async countByRuleConditions(where: SQL): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(this.buildRuleConditionsWhere(where));

        return result[0]?.count ?? 0;
    }

    async findIdsByRuleConditions(where: SQL): Promise<number[]> {
        const result = await this.db
            .selectDistinct({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(this.buildRuleConditionsWhere(where));

        return result.map(row => row.id);
    }

    async setCategoryByTransactionIds(transactionIds: number[], categoryId: number, tx?: DB): Promise<number[]> {
        const changedEntries = await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({ categoryId, categorySource: CategorySourceEnum.RULE })
            .where(
                and(
                    inArray(TransactionEntryEntityTable.transactionId, transactionIds),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    sql`${TransactionEntryEntityTable.categoryId} IS NOT ${categoryId}`
                )
            )
            .returning({ transactionId: TransactionEntryEntityTable.transactionId });

        return [...new Set(changedEntries.map(entry => entry.transactionId))];
    }

    private buildRuleConditionsWhere(where: SQL): SQL | undefined {
        return and(isNull(TransactionEntityTable.deletedAt), ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT), where);
    }
}
