import { and, asc, eq, gt, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

export class InvestmentReturnRepository extends Context.Service<InvestmentReturnRepository>()(
    '@budgie/contracts/InvestmentReturnRepository',
    {
        make: Effect.succeed({
            findLedgerMovements: (accountIds: readonly number[]) =>
                Db.query(db =>
                    db
                        .select({
                            accountId: TransactionEntryEntityTable.accountId,
                            entryType: TransactionEntryEntityTable.type,
                            amount: TransactionEntryEntityTable.amount,
                            operatedAt: TransactionEntityTable.operatedAt,
                            transactionType: TransactionEntityTable.type,
                            fromAccountId: TransactionEntityTable.fromAccountId,
                            toAccountId: TransactionEntityTable.toAccountId,
                            fundAccountId: TransactionEntityTable.fundAccountId,
                            externalId: TransactionEntityTable.externalId
                        })
                        .from(TransactionEntryEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .where(
                            and(
                                transactionFilters.buildVisibleTransactionCondition(),
                                transactionFilters.buildLedgerEntryCondition(),
                                inArray(TransactionEntryEntityTable.accountId, [...accountIds])
                            )
                        )
                        .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntryEntityTable.id))
                ),

            countTransfersSince: (accountId: number, since: Date) =>
                Db.query(db =>
                    db
                        .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
                        .from(TransactionEntryEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .where(
                            and(
                                transactionFilters.buildVisibleTransactionCondition(),
                                transactionFilters.buildLedgerEntryCondition(),
                                eq(TransactionEntryEntityTable.accountId, accountId),
                                eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                                gt(TransactionEntityTable.operatedAt, since),
                                or(
                                    isNull(TransactionEntityTable.externalSource),
                                    ne(TransactionEntityTable.externalSource, ExternalSourceEnum.INZHUR)
                                )
                            )
                        )
                ).pipe(Effect.map(rows => rows.at(0)?.count ?? 0))
        })
    }
) {
    static readonly layer = Layer.effect(InvestmentReturnRepository, InvestmentReturnRepository.make);
}
