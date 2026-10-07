import {
    AccountEntityTable,
    BaseTransactionFilterRepository,
    CategoryEntityTable,
    Db,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import { and, asc, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

export const fetchCategorizationEvalEntries = Effect.fnUntraced(function* () {
    const transactionFilters = new BaseTransactionFilterRepository();
    const entries = yield* Db.query(db =>
        db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categorySource: TransactionEntryEntityTable.categorySource,
                categoryTitle: CategoryEntityTable.title,
                categoryTitleEn: CategoryEntityTable.titleEn,
                isSystemCategory: CategoryEntityTable.isSystemCategory,
                categoryDeletedAt: CategoryEntityTable.deletedAt,
                mccDefaultCategoryId: MccCategoryEntityTable.defaultCategoryId,
                mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                mcc: MccCategoryEntityTable.mcc,
                mccDescription: MccCategoryEntityTable.fullDescription,
                transactionId: TransactionEntityTable.id,
                type: TransactionEntityTable.type,
                title: TransactionEntityTable.title,
                comment: TransactionEntityTable.comment,
                operatedAt: TransactionEntityTable.operatedAt,
                amount: TransactionEntryEntityTable.amount,
                baseAmount: TransactionEntryEntityTable.baseAmount,
                baseInstrumentId: TransactionEntryEntityTable.baseInstrumentId,
                instrumentSymbol: InstrumentEntityTable.symbol
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .leftJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
            .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
            .where(
                and(
                    transactionFilters.buildCategorizableEntryCondition(),
                    transactionFilters.buildVisibleTransactionCondition(),
                    transactionFilters.buildCategorizableTypeCondition(null)
                )
            )
            .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntityTable.id), asc(TransactionEntryEntityTable.id))
    );
    const tags = yield* Db.query(db =>
        db
            .select({ transactionId: TransactionTagsEntityTable.transactionId, tagId: TransactionTagsEntityTable.tagId })
            .from(TransactionTagsEntityTable)
            .orderBy(asc(TransactionTagsEntityTable.transactionId), asc(TransactionTagsEntityTable.tagId))
    );
    const tagIdsByTransactionId = new Map<number, number[]>();

    tags.forEach(({ transactionId, tagId }) =>
        tagIdsByTransactionId.set(transactionId, [...(tagIdsByTransactionId.get(transactionId) ?? []), tagId])
    );

    return entries.map(entry => ({ ...entry, tagIds: tagIdsByTransactionId.get(entry.transactionId) ?? [] }));
});
