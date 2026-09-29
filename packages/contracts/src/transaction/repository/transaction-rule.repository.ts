import { SQL, and, eq, inArray, ne, sql } from 'drizzle-orm';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { DB } from '../../@generic/type/db.type';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export class TransactionRuleRepository extends BaseTransactionFilterRepository {
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
                    inArray(
                        TransactionEntryEntityTable.transactionId,
                        this.db
                            .select({ id: TransactionEntityTable.id })
                            .from(TransactionEntityTable)
                            .where(and(inArray(TransactionEntityTable.id, transactionIds), this.buildVisibleTransactionCondition()))
                    ),
                    this.buildCategorizableEntryCondition(),
                    sql`${TransactionEntryEntityTable.categoryId} IS NOT ${categoryId}`
                )
            )
            .returning({ transactionId: TransactionEntryEntityTable.transactionId });

        return [...new Set(changedEntries.map(entry => entry.transactionId))];
    }

    private buildRuleConditionsWhere(where: SQL): SQL | undefined {
        return and(
            this.buildVisibleTransactionCondition(),
            this.buildLedgerEntryCondition(),
            ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            where
        );
    }
}
