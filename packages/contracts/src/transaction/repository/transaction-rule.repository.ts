import { SQL, and, eq, inArray, ne, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export class TransactionRuleRepository extends Context.Service<TransactionRuleRepository>()('@budgie/contracts/TransactionRuleRepository', {
    make: Effect.sync(() => {
        const transactionFilters = new BaseTransactionFilterRepository();
        const buildRuleConditionsWhere = (where: SQL): SQL | undefined =>
            and(
                transactionFilters.buildVisibleTransactionCondition(),
                transactionFilters.buildLedgerEntryCondition(),
                ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                where
            );

        return {
            countByRuleConditions: (where: SQL) =>
                Db.query(db =>
                    db
                        .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
                        .from(TransactionEntityTable)
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .where(buildRuleConditionsWhere(where))
                ).pipe(Effect.map(result => result[0]?.count ?? 0)),
            findIdsByRuleConditions: (where: SQL) =>
                Db.query(db =>
                    db
                        .selectDistinct({ id: TransactionEntityTable.id })
                        .from(TransactionEntityTable)
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .where(buildRuleConditionsWhere(where))
                ).pipe(Effect.map(result => result.map(row => row.id))),
            setCategoryByTransactionIds: (transactionIds: number[], categoryId: number) =>
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
                                        .where(
                                            and(
                                                inArray(TransactionEntityTable.id, transactionIds),
                                                transactionFilters.buildVisibleTransactionCondition()
                                            )
                                        )
                                ),
                                transactionFilters.buildCategorizableEntryCondition(),
                                sql`${TransactionEntryEntityTable.categoryId} IS NOT ${categoryId}`
                            )
                        )
                        .returning({ transactionId: TransactionEntryEntityTable.transactionId })
                ).pipe(Effect.map(changedEntries => [...new Set(changedEntries.map(entry => entry.transactionId))]))
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionRuleRepository, TransactionRuleRepository.make);
}
