import { SQL, and, eq, gt, isNull, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { INVESTMENTS_CATEGORY_ID } from '../../category/constant/investments-category-id.constant';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

import type { FundDividendTotalsInterface } from '../interface/fund-dividend-totals.interface';

export class InvestmentReturnRepository extends Context.Service<InvestmentReturnRepository>()(
    '@budgie/contracts/InvestmentReturnRepository',
    {
        make: Effect.sync(() => {
            const buildTotalSql = (comparison: SQL) =>
                sql<number>`COALESCE(SUM(CASE WHEN ${comparison} THEN COALESCE(${TransactionEntryEntityTable.baseAmount}, ${TransactionEntryEntityTable.amount}) ELSE 0 END), 0)`;

            const bankTotalSql = buildTotalSql(sql`${AccountEntityTable.externalSource} IS NOT ${ExternalSourceEnum.INZHUR}`);
            const reinvestedTotalSql = buildTotalSql(sql`${AccountEntityTable.externalSource} IS ${ExternalSourceEnum.INZHUR}`);

            return {
                getFundDividendTotals: (fundTitle: string) =>
                    Db.query(db =>
                        db
                            .select({ bank: bankTotalSql, reinvested: reinvestedTotalSql })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                            .where(
                                and(
                                    transactionFilters.buildVisibleTransactionCondition(),
                                    transactionFilters.buildCategorizableEntryCondition(),
                                    eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                                    eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT),
                                    eq(TransactionEntryEntityTable.categoryId, INVESTMENTS_CATEGORY_ID),
                                    eq(TransactionEntityTable.title, fundTitle)
                                )
                            )
                    ).pipe(Effect.map((rows): FundDividendTotalsInterface => rows.at(0) ?? { bank: 0, reinvested: 0 })),

                countTransfersSince: (accountId: number, since: Date) =>
                    Db.query(db =>
                        db
                            .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})` })
                            .from(TransactionEntityTable)
                            .innerJoin(
                                TransactionEntryEntityTable,
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)
                            )
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
            };
        })
    }
) {
    static readonly layer = Layer.effect(InvestmentReturnRepository, InvestmentReturnRepository.make);
}
