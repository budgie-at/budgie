import {
    AccountEntityTable,
    CategorySourceEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    ExternalSourceEnum,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    AccountTypeEnum,
    TransactionEntityTable,
    Db,
    TransactionTypeEnum,
    UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID,
    transactionFilters
} from '@budgie/contracts';
import { and, eq, gt, gte, inArray, isNull, like, lte, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { ownTransferDetector } from '../detector/own-transfer.detector';

import type { ConsolidationScanScopeInterface, DB } from '@budgie/contracts';
import type { SQL } from 'drizzle-orm';

export class OwnTransferRepository extends Context.Service<OwnTransferRepository>()('@budgie/sync/OwnTransferRepository', {
    make: Effect.sync(() => {
        const findVisibleTransactionIds = (db: DB, entryCondition: SQL | undefined) =>
            db
                .select({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                .where(
                    and(
                        transactionFilters.buildVisibleTransactionCondition(),
                        isNull(AccountEntityTable.deletedAt),
                        transactionFilters.buildCategorizableEntryCondition(),
                        entryCondition
                    )
                );
        const buildUnconsolidatedScopeFilter = (scope: ConsolidationScanScopeInterface | null) =>
            ({
                ...(isDefined(scope) && {
                    operatedAt: {
                        gte: new Date(scope.operatedAtFrom.getTime() - TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000),
                        lte: new Date(scope.operatedAtTo.getTime() + TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000)
                    }
                }),
                consolidationType: { isNull: true },
                updatedBy: { isNull: true }
            }) as const;

        const findTransactions = (
            scope: ConsolidationScanScopeInterface | null,
            transactionIds: number[] | null,
            titleCondition: SQL | undefined
        ) =>
            Db.query(db =>
                db.query.TransactionEntityTable.findMany({
                    where: {
                        RAW: table =>
                            inArray(
                                table.id,
                                findVisibleTransactionIds(
                                    db,
                                    and(
                                        titleCondition,
                                        gt(TransactionEntryEntityTable.amount, 0),
                                        or(
                                            isNull(TransactionEntryEntityTable.categoryId),
                                            inArray(TransactionEntryEntityTable.categorySource, [
                                                CategorySourceEnum.MCC_DEFAULT,
                                                CategorySourceEnum.AI
                                            ])
                                        )
                                    )
                                )
                            ),
                        ...buildUnconsolidatedScopeFilter(scope),
                        ...(isDefined(transactionIds) && { id: { in: transactionIds } }),
                        ...(!isDefined(transactionIds) && { externalSource: { isNotNull: true } }),
                        type: { in: [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME] }
                    },
                    with: { entries: { where: transactionFilters.ledgerEntryFilter } }
                })
            );

        return {
            findTransactions: (scope: ConsolidationScanScopeInterface | null, transactionIds: number[] | null = null) =>
                findTransactions(scope, transactionIds, sql`1`),
            findCandidates: (scope: ConsolidationScanScopeInterface | null, identities: readonly string[]) =>
                findTransactions(
                    scope,
                    null,
                    or(
                        sql`${TransactionEntityTable.title} GLOB '*[^ -~]*'`,
                        like(TransactionEntityTable.title, '%*%'),
                        like(TransactionEntityTable.title, '%xx%'),
                        like(TransactionEntityTable.title, 'Binance %'),
                        ...ownTransferDetector
                            .getTitleSearchTokens(identities)
                            .map(token => like(TransactionEntityTable.title, `%${token}%`))
                    )
                ),
            findUntrackedTransfers: (scope: ConsolidationScanScopeInterface | null) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        where: {
                            RAW: table =>
                                inArray(
                                    table.id,
                                    findVisibleTransactionIds(db, eq(AccountEntityTable.externalId, UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID))
                                ),
                            ...buildUnconsolidatedScopeFilter(scope),
                            type: TransactionTypeEnum.TRANSFER
                        },
                        with: {
                            entries: {
                                where: {
                                    ...transactionFilters.ledgerEntryFilter
                                },
                                with: { account: { columns: { externalId: true } } }
                            }
                        }
                    })
                ).pipe(
                    Effect.map(transfers =>
                        transfers.map(transfer => ({
                            ...transfer,
                            untrackedAccountId: transfer.entries.find(
                                entry => entry.account.externalId === UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID
                            )?.accountId,
                            entries: transfer.entries.filter(entry => entry.account.externalId !== UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID)
                        }))
                    )
                ),
            findOpposites: (transactionIds: number[]) =>
                Db.query(db => {
                    const source = alias(TransactionEntityTable, 'source');
                    const sourceEntry = alias(TransactionEntryEntityTable, 'source_entry');
                    const sourceAccount = alias(AccountEntityTable, 'source_account');

                    return db
                        .selectDistinct({ transactionId: source.id, oppositeId: TransactionEntityTable.id })
                        .from(source)
                        .innerJoin(
                            sourceEntry,
                            and(
                                eq(sourceEntry.transactionId, source.id),
                                eq(sourceEntry.kind, TransactionEntryKindEnum.PRIMARY),
                                ne(sourceEntry.type, TransactionEntryTypeEnum.FEE),
                                isNull(sourceEntry.deletedAt),
                                isNull(sourceEntry.originalTransactionId)
                            )
                        )
                        .innerJoin(
                            sourceAccount,
                            and(
                                eq(sourceAccount.id, sourceEntry.accountId),
                                or(isNull(sourceAccount.externalId), ne(sourceAccount.externalId, UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID))
                            )
                        )
                        .innerJoin(
                            TransactionEntityTable,
                            and(
                                inArray(TransactionEntityTable.type, [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]),
                                gte(TransactionEntityTable.operatedAt, sql`${source.operatedAt} - ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}`),
                                lte(TransactionEntityTable.operatedAt, sql`${source.operatedAt} + ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}`)
                            )
                        )
                        .innerJoin(
                            TransactionEntryEntityTable,
                            and(
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
                                transactionFilters.buildCategorizableEntryCondition(),
                                ne(TransactionEntryEntityTable.type, sourceEntry.type),
                                ne(TransactionEntryEntityTable.accountId, sourceEntry.accountId)
                            )
                        )
                        .innerJoin(
                            AccountEntityTable,
                            and(
                                eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId),
                                eq(AccountEntityTable.isExternal, false),
                                isNull(AccountEntityTable.deletedAt),
                                transactionFilters.buildNonDebtAccountCondition()
                            )
                        )
                        .where(
                            and(
                                or(
                                    ne(AccountEntityTable.instrumentId, sourceAccount.instrumentId),
                                    and(
                                        eq(AccountEntityTable.instrumentId, sourceAccount.instrumentId),
                                        sql`CASE WHEN ${sourceEntry.type} = ${TransactionEntryTypeEnum.CREDIT}
                                            THEN ${TransactionEntryEntityTable.amount} BETWEEN ${sourceEntry.amount} * 0.98 AND ${sourceEntry.amount} + ${PRECISION / 100}
                                            ELSE ${sourceEntry.amount} BETWEEN ${TransactionEntryEntityTable.amount} * 0.98 AND ${TransactionEntryEntityTable.amount} + ${PRECISION / 100} END`
                                    )
                                ),
                                inArray(source.id, transactionIds),
                                transactionFilters.buildVisibleTransactionCondition(),
                                isNull(TransactionEntityTable.consolidationType)
                            )
                        );
                }),
            findAccounts: Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: { deletedAt: { isNull: true }, isExternal: false, NOT: { type: AccountTypeEnum.DEBT } },
                    with: { instrument: { columns: { type: true } } }
                })
            ),
            findIdentities: Db.query(db =>
                db.query.BankIntegrationEntityTable.findMany({
                    where: { provider: ExternalSourceEnum.MONOBANK, deletedAt: { isNull: true }, label: { isNotNull: true } },
                    columns: { label: true }
                })
            )
        };
    })
}) {
    static readonly layer = Layer.effect(OwnTransferRepository, OwnTransferRepository.make);
}
