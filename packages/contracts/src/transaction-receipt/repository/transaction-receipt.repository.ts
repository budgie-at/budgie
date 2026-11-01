import { and, between, count, desc, eq, inArray, isNotNull, isNull, notExists, notInArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { AccountExternalIdEntityTable } from '../../account/table/account-external-id-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionReceiptEntityTable } from '../table/transaction-receipt-entity.table';

import type { CurrencyEnum } from '../../@generic/enum/currency.enum';
import type { TransactionReceiptCreateEntityInterface } from '../entity/transaction-receipt-create-entity.interface';
import type { ReceiptMatchCandidateQueryInterface } from '../interface/receipt-match-candidate-query.interface';
import type { SQL } from 'drizzle-orm';

export class TransactionReceiptRepository extends Context.Service<TransactionReceiptRepository>()(
    '@budgie/contracts/TransactionReceiptRepository',
    {
        make: Effect.sync(() => {
            const operationInstrument = alias(InstrumentEntityTable, 'operation_instrument');
            const expenseEntryCondition = and(
                eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                transactionFilters.buildVisibleTransactionCondition(),
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
            );
            const buildActiveAccountCondition = (currency: CurrencyEnum) =>
                and(isNull(AccountEntityTable.deletedAt), eq(AccountEntityTable.isActive, true), eq(InstrumentEntityTable.code, currency));

            const findCardAccountId = (cardExternalId: string, currency: CurrencyEnum) =>
                Db.query(db =>
                    db
                        .select({ accountId: AccountEntityTable.id })
                        .from(AccountExternalIdEntityTable)
                        .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, AccountExternalIdEntityTable.accountId))
                        .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                        .where(and(eq(AccountExternalIdEntityTable.externalId, cardExternalId), buildActiveAccountCondition(currency)))
                ).pipe(Effect.map(rows => rows.at(0)?.accountId ?? null));

            const findLatestExpenseAccountId = (currency: CurrencyEnum) =>
                Db.query(db =>
                    db
                        .select({ accountId: AccountEntityTable.id })
                        .from(AccountEntityTable)
                        .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                        .where(
                            and(
                                expenseEntryCondition,
                                transactionFilters.buildNonDebtAccountCondition(),
                                buildActiveAccountCondition(currency)
                            )
                        )
                        .orderBy(desc(TransactionEntityTable.operatedAt), desc(TransactionEntityTable.id))
                        .limit(1)
                ).pipe(Effect.map(rows => rows.at(0)?.accountId ?? null));

            const findMostFrequentCategoryId = (merchantCondition: SQL) =>
                Db.query(db =>
                    db
                        .select({ categoryId: TransactionEntryEntityTable.categoryId })
                        .from(TransactionEntityTable)
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .leftJoin(TransactionReceiptEntityTable, eq(TransactionReceiptEntityTable.transactionId, TransactionEntityTable.id))
                        .where(and(expenseEntryCondition, isNotNull(TransactionEntryEntityTable.categoryId), merchantCondition))
                        .groupBy(TransactionEntryEntityTable.categoryId)
                        .orderBy(desc(count()), desc(sql`max(${TransactionEntityTable.operatedAt})`))
                        .limit(1)
                ).pipe(Effect.map(rows => rows.at(0)?.categoryId ?? null));

            return {
                findByFingerprint: (fingerprint: string) =>
                    Db.query(db => db.query.TransactionReceiptEntityTable.findFirst({ where: { fingerprint } })),
                deleteForDeletedTransaction: (fingerprint: string) =>
                    Db.query(db =>
                        db
                            .delete(TransactionReceiptEntityTable)
                            .where(
                                and(
                                    eq(TransactionReceiptEntityTable.fingerprint, fingerprint),
                                    inArray(
                                        TransactionReceiptEntityTable.transactionId,
                                        db
                                            .select({ id: TransactionEntityTable.id })
                                            .from(TransactionEntityTable)
                                            .where(isNotNull(TransactionEntityTable.deletedAt))
                                    )
                                )
                            )
                    ),
                insert: (input: TransactionReceiptCreateEntityInterface) =>
                    Db.query(db => db.insert(TransactionReceiptEntityTable).values(input).returning()).pipe(
                        Effect.map(([receipt]) => receipt)
                    ),
                moveToTransaction: (fromTransactionId: number, toTransactionId: number) =>
                    Db.query(db =>
                        db
                            .update(TransactionReceiptEntityTable)
                            .set({ transactionId: toTransactionId })
                            .where(
                                and(
                                    eq(TransactionReceiptEntityTable.transactionId, fromTransactionId),
                                    notExists(
                                        db
                                            .select({ transactionId: TransactionReceiptEntityTable.transactionId })
                                            .from(TransactionReceiptEntityTable)
                                            .where(eq(TransactionReceiptEntityTable.transactionId, toTransactionId))
                                    )
                                )
                            )
                    ),
                findMatchCandidates: ({ total, currency, from, to, cardExternalId }: ReceiptMatchCandidateQueryInterface) =>
                    Db.query(db =>
                        db
                            .select({
                                transactionId: TransactionEntityTable.id,
                                entryId: TransactionEntryEntityTable.id,
                                accountId: TransactionEntryEntityTable.accountId,
                                categoryId: TransactionEntryEntityTable.categoryId,
                                title: TransactionEntityTable.title,
                                comment: TransactionEntityTable.comment,
                                updatedBy: TransactionEntityTable.updatedBy,
                                operatedAt: TransactionEntityTable.operatedAt,
                                isCardMatch:
                                    sql`EXISTS (SELECT 1 FROM ${AccountExternalIdEntityTable} WHERE ${AccountExternalIdEntityTable.externalId} = ${cardExternalId} AND ${AccountExternalIdEntityTable.accountId} = ${TransactionEntryEntityTable.accountId})`.mapWith(
                                        Boolean
                                    )
                            })
                            .from(TransactionEntityTable)
                            .innerJoin(
                                TransactionEntryEntityTable,
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)
                            )
                            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                            .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                            .leftJoin(operationInstrument, eq(operationInstrument.id, TransactionEntryEntityTable.operationInstrumentId))
                            .where(
                                and(
                                    expenseEntryCondition,
                                    between(TransactionEntityTable.operatedAt, from, to),
                                    or(
                                        and(eq(operationInstrument.code, currency), eq(TransactionEntryEntityTable.operationAmount, total)),
                                        and(eq(InstrumentEntityTable.code, currency), eq(TransactionEntryEntityTable.amount, total))
                                    ),
                                    notInArray(
                                        TransactionEntityTable.id,
                                        db
                                            .select({ transactionId: TransactionReceiptEntityTable.transactionId })
                                            .from(TransactionReceiptEntityTable)
                                    )
                                )
                            )
                    ),
                findMerchantCategoryId: Effect.fn('TransactionReceiptRepository.findMerchantCategoryId')(function* (
                    merchantVatId: string | null,
                    normalizedTitle: string
                ) {
                    const vatCategoryId = isDefined(merchantVatId)
                        ? yield* findMostFrequentCategoryId(eq(TransactionReceiptEntityTable.merchantVatId, merchantVatId))
                        : null;

                    return (
                        vatCategoryId ??
                        (isNotEmptyString(normalizedTitle)
                            ? yield* findMostFrequentCategoryId(sql`lower(trim(${TransactionEntityTable.title})) = ${normalizedTitle}`)
                            : null)
                    );
                }),
                findExpenseAccountId: Effect.fn('TransactionReceiptRepository.findExpenseAccountId')(function* (
                    currency: CurrencyEnum,
                    cardExternalId: string | null
                ) {
                    const cardAccountId = isDefined(cardExternalId) ? yield* findCardAccountId(cardExternalId, currency) : null;

                    return cardAccountId ?? (yield* findLatestExpenseAccountId(currency));
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionReceiptRepository, TransactionReceiptRepository.make);
}
