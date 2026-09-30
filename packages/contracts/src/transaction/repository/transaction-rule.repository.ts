import { SQL, and, eq, inArray, ne, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export class TransactionRuleRepository extends BaseTransactionFilterRepository {
    readonly countByRuleConditions = (where: SQL) =>
        Db.query(db =>
            db
                .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(this.buildRuleConditionsWhere(where))
        ).pipe(Effect.map(result => result[0]?.count ?? 0));

    readonly findIdsByRuleConditions = (where: SQL) =>
        Db.query(db =>
            db
                .selectDistinct({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(this.buildRuleConditionsWhere(where))
        ).pipe(Effect.map(result => result.map(row => row.id)));

    readonly setCategoryByTransactionIds = (transactionIds: number[], categoryId: number) =>
        Db.query(db =>
            db
                .update(TransactionEntryEntityTable)
                .set({ categoryId, categorySource: CategorySourceEnum.RULE })
                .where(
                    and(
                        inArray(
                            TransactionEntryEntityTable.transactionId,
                            db
                                .select({ id: TransactionEntityTable.id })
                                .from(TransactionEntityTable)
                                .where(and(inArray(TransactionEntityTable.id, transactionIds), this.buildVisibleTransactionCondition()))
                        ),
                        this.buildCategorizableEntryCondition(),
                        sql`${TransactionEntryEntityTable.categoryId} IS NOT ${categoryId}`
                    )
                )
                .returning({ transactionId: TransactionEntryEntityTable.transactionId })
        ).pipe(Effect.map(changedEntries => [...new Set(changedEntries.map(entry => entry.transactionId))]));

    private buildRuleConditionsWhere(where: SQL): SQL | undefined {
        return and(
            this.buildVisibleTransactionCondition(),
            this.buildLedgerEntryCondition(),
            ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            where
        );
    }
}
