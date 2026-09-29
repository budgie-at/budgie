import { SQL, and, eq, inArray, ne, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export class TransactionRuleRepository extends BaseTransactionFilterRepository {
    readonly countByRuleConditions = Effect.fn('TransactionRuleRepository.countByRuleConditions')(function* (
        this: TransactionRuleRepository,
        where: SQL
    ) {
        const result = yield* Db.query(db =>
            db
                .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(this.buildRuleConditionsWhere(where))
        );

        return result[0]?.count ?? 0;
    });

    readonly findIdsByRuleConditions = Effect.fn('TransactionRuleRepository.findIdsByRuleConditions')(function* (
        this: TransactionRuleRepository,
        where: SQL
    ) {
        const result = yield* Db.query(db =>
            db
                .selectDistinct({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(this.buildRuleConditionsWhere(where))
        );

        return result.map(row => row.id);
    });

    readonly setCategoryByTransactionIds = Effect.fn('TransactionRuleRepository.setCategoryByTransactionIds')(function* (
        this: TransactionRuleRepository,
        transactionIds: number[],
        categoryId: number
    ) {
        const changedEntries = yield* Db.query(db =>
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
        );

        return [...new Set(changedEntries.map(entry => entry.transactionId))];
    });

    private buildRuleConditionsWhere(where: SQL): SQL | undefined {
        return and(
            this.buildVisibleTransactionCondition(),
            this.buildLedgerEntryCondition(),
            ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            where
        );
    }
}
