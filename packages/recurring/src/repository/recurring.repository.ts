import {
    AccountEntityTable,
    BaseTransactionFilterRepository,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    Db,
    ExchangeRateEntityTable,
    LanguageEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, eq, gt, gte, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export class RecurringRepository extends Context.Service<RecurringRepository>()('@budgie/recurring/RecurringRepository', {
    make: Effect.sync(() => {
        const filters = new BaseTransactionFilterRepository();

        return {
            findCharges: (defaultInstrumentId: number | null, language: LanguageEnum, since: Date) =>
                Db.query(db => {
                    const rateToDefault = sql<number>`COALESCE(
                        (SELECT ${ExchangeRateEntityTable.rate} * 1.0 FROM ${ExchangeRateEntityTable}
                         WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${AccountEntityTable.instrumentId}
                           AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId}
                           AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                         ORDER BY ${ExchangeRateEntityTable.createdAt} DESC LIMIT 1),
                        (SELECT 1.0 / ${ExchangeRateEntityTable.rate} FROM ${ExchangeRateEntityTable}
                         WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
                           AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${AccountEntityTable.instrumentId}
                           AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                         ORDER BY ${ExchangeRateEntityTable.createdAt} DESC LIMIT 1),
                        1.0
                    )`;
                    const defaultAmount = sql<number>`${TransactionEntryEntityTable.amount} * (CASE WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.INCOME} THEN -1.0 ELSE 1.0 END) * ${rateToDefault}`;

                    return db
                        .select({
                            transactionId: TransactionEntityTable.id,
                            operatedAt: TransactionEntityTable.operatedAt,
                            title: TransactionEntityTable.title,
                            comment: TransactionEntityTable.comment,
                            defaultAmount,
                            accountId: AccountEntityTable.id,
                            categoryId: TransactionEntryEntityTable.categoryId,
                            categoryTitle: sql<
                                string | null
                            >`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`,
                            categoryIcon: CategoryEntityTable.icon
                        })
                        .from(TransactionEntityTable)
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                        .leftJoin(
                            DefaultCategoryTranslationEntityTable,
                            and(
                                eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                                eq(DefaultCategoryTranslationEntityTable.language, language)
                            )
                        )
                        .where(
                            and(
                                or(
                                    and(
                                        eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                                        eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
                                    ),
                                    and(
                                        eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                                        eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT)
                                    )
                                ),
                                filters.buildVisibleTransactionCondition(),
                                filters.buildCategorizableEntryCondition(),
                                filters.buildNonDebtAccountCondition(),
                                gt(TransactionEntryEntityTable.amount, 0),
                                gte(TransactionEntityTable.operatedAt, since),
                                or(ne(TransactionEntityTable.title, ''), ne(TransactionEntityTable.comment, ''))
                            )
                        );
                })
        };
    })
}) {
    static readonly layer = Layer.effect(RecurringRepository, RecurringRepository.make);
}
