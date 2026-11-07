import {
    AccountEntityTable,
    CategorySourceEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    ExternalSourceEnum,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    AccountTypeEnum,
    TransactionEntityTable,
    Db,
    TransactionTypeEnum,
    transactionFilters
} from '@budgie/contracts';
import { and, eq, gt, gte, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class OwnTransferRepository extends Context.Service<OwnTransferRepository>()('@budgie/sync/OwnTransferRepository', {
    make: Effect.succeed({
        findTransactions: (scope: ConsolidationScanScopeInterface | null, transactionIds: number[] | null = null) =>
            Db.query(db =>
                db.query.TransactionEntityTable.findMany({
                    where: {
                        RAW: table =>
                            inArray(
                                table.id,
                                db
                                    .select({ id: TransactionEntityTable.id })
                                    .from(TransactionEntityTable)
                                    .innerJoin(
                                        TransactionEntryEntityTable,
                                        eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)
                                    )
                                    .where(
                                        and(
                                            transactionFilters.buildVisibleTransactionCondition(),
                                            transactionFilters.buildCategorizableEntryCondition(),
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
                        ...(isDefined(scope) && {
                            operatedAt: {
                                gte: new Date(scope.operatedAtFrom.getTime() - TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000),
                                lte: new Date(scope.operatedAtTo.getTime() + TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000)
                            }
                        }),
                        ...(isDefined(transactionIds) && { id: { in: transactionIds } }),
                        consolidationType: { isNull: true },
                        updatedBy: { isNull: true },
                        externalSource: { isNotNull: true },
                        type: { in: [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME] }
                    },
                    with: { entries: { where: transactionFilters.ledgerEntryFilter } }
                })
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
                            isNull(sourceEntry.deletedAt),
                            isNull(sourceEntry.originalTransactionId)
                        )
                    )
                    .innerJoin(sourceAccount, eq(sourceAccount.id, sourceEntry.accountId))
                    .innerJoin(
                        TransactionEntityTable,
                        and(
                            or(
                                and(
                                    eq(source.type, TransactionTypeEnum.EXPENSE),
                                    eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME)
                                ),
                                and(
                                    eq(source.type, TransactionTypeEnum.INCOME),
                                    eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE)
                                )
                            ),
                            gte(TransactionEntityTable.operatedAt, sql`${source.operatedAt} - ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}`),
                            lte(TransactionEntityTable.operatedAt, sql`${source.operatedAt} + ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}`)
                        )
                    )
                    .innerJoin(
                        TransactionEntryEntityTable,
                        and(
                            eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
                            transactionFilters.buildPrimaryLedgerEntryCondition(),
                            ne(TransactionEntryEntityTable.accountId, sourceEntry.accountId),
                            sql`abs(${TransactionEntryEntityTable.amount} - ${sourceEntry.amount}) <= ${PRECISION / 100}`
                        )
                    )
                    .innerJoin(
                        AccountEntityTable,
                        and(
                            eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId),
                            eq(AccountEntityTable.instrumentId, sourceAccount.instrumentId),
                            eq(AccountEntityTable.isExternal, false),
                            isNull(AccountEntityTable.deletedAt),
                            transactionFilters.buildNonDebtAccountCondition()
                        )
                    )
                    .where(
                        and(
                            inArray(source.id, transactionIds),
                            transactionFilters.buildVisibleTransactionCondition(),
                            isNull(TransactionEntityTable.consolidationType)
                        )
                    );
            }),
        findAccounts: Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: { deletedAt: { isNull: true }, isExternal: false, NOT: { type: AccountTypeEnum.DEBT } }
            })
        ),
        findIdentities: Db.query(db =>
            db.query.BankIntegrationEntityTable.findMany({
                where: { provider: ExternalSourceEnum.MONOBANK, deletedAt: { isNull: true }, label: { isNotNull: true } },
                columns: { label: true }
            })
        )
    })
}) {
    static readonly layer = Layer.effect(OwnTransferRepository, OwnTransferRepository.make);
}
