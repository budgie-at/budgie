import { and, eq, gte, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { QueryBuilder, alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionConsolidationTypeEnum } from '../enum/transaction-consolidation-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { ConsolidationSourceRowInterface } from '../interface/consolidation-source-row.interface';

export class TransactionConsolidationRepository extends Context.Service<TransactionConsolidationRepository>()(
    '@budgie/contracts/TransactionConsolidationRepository',
    {
        make: Effect.sync(() => {
            const filters = new BaseTransactionFilterRepository();

            const queryBuilder = new QueryBuilder();

            return {
                findActiveAutoConsolidatedByAccountIds: Effect.fn(
                    'TransactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds'
                )(function* (accountIds: number[]) {
                    if (isEmptyArray(accountIds)) {
                        return [];
                    }

                    const movedSourceCanonicalIds = queryBuilder
                        .select({ transactionId: TransactionEntryEntityTable.transactionId })
                        .from(TransactionEntryEntityTable)
                        .where(
                            and(
                                inArray(TransactionEntryEntityTable.accountId, accountIds),
                                isNotNull(TransactionEntryEntityTable.originalTransactionId),
                                isNull(TransactionEntryEntityTable.deletedAt)
                            )
                        );

                    return yield* Db.query(db =>
                        db
                            .select({ id: TransactionEntityTable.id })
                            .from(TransactionEntityTable)
                            .where(
                                and(
                                    isNotNull(TransactionEntityTable.consolidationType),
                                    isNull(TransactionEntityTable.deletedAt),
                                    or(
                                        inArray(TransactionEntityTable.fromAccountId, accountIds),
                                        inArray(TransactionEntityTable.toAccountId, accountIds),
                                        inArray(TransactionEntityTable.id, movedSourceCanonicalIds)
                                    )
                                )
                            )
                    );
                }),

                findActiveAutoConsolidatedByAccountIdsSince: Effect.fn(
                    'TransactionConsolidationRepository.findActiveAutoConsolidatedByAccountIdsSince'
                )(function* (accountIds: number[], since: Date) {
                    if (isEmptyArray(accountIds)) {
                        return [];
                    }
                    const sourceTransaction = alias(TransactionEntityTable, 'source_tx');

                    return yield* Db.query(db =>
                        db
                            .selectDistinct({ id: TransactionEntityTable.id })
                            .from(TransactionEntityTable)
                            .innerJoin(
                                TransactionEntryEntityTable,
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)
                            )
                            .innerJoin(sourceTransaction, eq(sourceTransaction.id, TransactionEntryEntityTable.originalTransactionId))
                            .where(
                                and(
                                    isNotNull(TransactionEntityTable.consolidationType),
                                    isNull(TransactionEntityTable.deletedAt),
                                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                                    isNull(TransactionEntryEntityTable.deletedAt),
                                    gte(sourceTransaction.operatedAt, since)
                                )
                            )
                    );
                }),

                setConsolidationParent: Effect.fn('TransactionConsolidationRepository.setConsolidationParent')(function* (
                    sourceTransactionIds: number[],
                    canonicalTransactionId: number
                ) {
                    if (isEmptyArray(sourceTransactionIds)) {
                        return;
                    }

                    yield* Db.query(db =>
                        db
                            .update(TransactionEntityTable)
                            .set({ consolidationParentTransactionId: canonicalTransactionId })
                            .where(
                                and(inArray(TransactionEntityTable.id, sourceTransactionIds), filters.buildVisibleTransactionCondition())
                            )
                    );
                }),

                findConsolidationSources: (canonicalTransactionId: number, language: LanguageEnum) =>
                    Db.query(db =>
                        db.$client.getAllAsync<ConsolidationSourceRowInterface>(
                            `SELECT
                moved.transaction_id AS canonicalTransactionId,
                moved.original_transaction_id AS sourceTransactionId,
                source.type AS sourceType,
                source.title AS sourceTitle,
                source.comment AS sourceComment,
                source.external_id AS sourceExternalId,
                source.external_source AS sourceExternalSource,
                source.operated_at * 1000 AS sourceOperatedAtMs,
                moved.id AS entryId,
                moved.type AS entryType,
                moved.amount AS amount,
                moved.exchange_rate AS exchangeRate,
                account.id AS accountId,
                account.title AS accountTitle,
                account.icon AS accountIcon,
                source_from_account.title AS sourceFromAccountTitle,
                source_from_account.icon AS sourceFromAccountIcon,
                source_to_account.title AS sourceToAccountTitle,
                source_to_account.icon AS sourceToAccountIcon,
                canonical_from_account.title AS canonicalFromAccountTitle,
                canonical_from_account.icon AS canonicalFromAccountIcon,
                canonical_to_account.title AS canonicalToAccountTitle,
                canonical_to_account.icon AS canonicalToAccountIcon,
                instrument.id AS instrumentId,
                instrument.code AS currencyCode,
                instrument.symbol AS currencySymbol,
                COALESCE(
                    (SELECT translation.title
                     FROM default_category_translations translation
                     WHERE translation.category_id = category.id
                       AND translation.language = ?),
                    category.title
                ) AS categoryTitle,
                category.icon AS categoryIcon,
                mcc.mcc AS mcc,
                mcc.short_description AS mccDescription,
                moved.to_iban AS toIban
            FROM transaction_entries moved
            INNER JOIN transactions source ON source.id = moved.original_transaction_id
            INNER JOIN transactions canonical ON canonical.id = moved.transaction_id
            INNER JOIN accounts account ON account.id = moved.account_id
            INNER JOIN instruments instrument ON instrument.id = account.instrument_id
            LEFT JOIN accounts source_from_account ON source_from_account.id = source.from_account_id
            LEFT JOIN accounts source_to_account ON source_to_account.id = source.to_account_id
            LEFT JOIN accounts canonical_from_account ON canonical_from_account.id = canonical.from_account_id
            LEFT JOIN accounts canonical_to_account ON canonical_to_account.id = canonical.to_account_id
            LEFT JOIN categories category ON category.id = moved.category_id
            LEFT JOIN mcc_categories mcc ON mcc.id = moved.mcc_category_id
            WHERE moved.transaction_id = ?
              AND moved.original_transaction_id IS NOT NULL
              AND moved.deleted_at IS NULL
            ORDER BY source.operated_at ASC, source.id ASC, moved.id ASC`,
                            [language, canonicalTransactionId]
                        )
                    ),

                setConsolidationType: (transactionId: number, type: TransactionConsolidationTypeEnum | null) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntityTable)
                            .set({ consolidationType: type })
                            .where(
                                and(
                                    eq(TransactionEntityTable.id, transactionId),
                                    isNull(TransactionEntityTable.consolidationParentTransactionId)
                                )
                            )
                    ),

                clearConsolidationParent: (canonicalTransactionId: number) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntityTable)
                            .set({ consolidationParentTransactionId: null })
                            .where(eq(TransactionEntityTable.consolidationParentTransactionId, canonicalTransactionId))
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionConsolidationRepository, TransactionConsolidationRepository.make);
}
