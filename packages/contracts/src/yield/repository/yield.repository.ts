import { and, asc, eq, gt, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { buildEntryBaseValueSql } from '../../@generic/utils/build-entry-base-value-sql.util';
import { CRYPTO_ACCOUNT_TYPES } from '../../account/constant/crypto-account-types.constant';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { YieldKindEnum } from '../../transaction/enum/yield-kind.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

import type { YieldFactRowInterface } from '../interface/yield-fact-row.interface';
import type { YieldPayoutQueryInterface } from '../interface/yield-payout-query.interface';
import type { YieldPositionMovementRowInterface } from '../interface/yield-position-movement-row.interface';
import type { YieldScopeInterface } from '../interface/yield-scope.interface';
import type { SQL } from 'drizzle-orm';
import type { SQLiteEffectSelect } from 'drizzle-orm/sqlite-core/effect';

export class YieldRepository extends Context.Service<YieldRepository>()('@budgie/contracts/YieldRepository', {
    make: Effect.sync(() => {
        const POSITION_ACCOUNT_TYPES = [AccountTypeEnum.DEPOSIT, AccountTypeEnum.SAVINGS, ...CRYPTO_ACCOUNT_TYPES, AccountTypeEnum.STOCKS];
        const RATED_ACCOUNT_TYPES = [AccountTypeEnum.DEPOSIT, AccountTypeEnum.SAVINGS];
        const NO_MOVEMENTS: readonly YieldPositionMovementRowInterface[] = [];
        const yieldSourceAccount = alias(AccountEntityTable, 'yield_source_account');

        const landingHoldsPositionSql = sql`(${inArray(AccountEntityTable.type, POSITION_ACCOUNT_TYPES)} OR ${eq(InstrumentEntityTable.type, InstrumentTypeEnum.FUND)})`;
        const positionAccountIdSql = sql<number | null>`CASE
            WHEN ${TransactionEntityTable.yieldSourceAccountId} IS NOT NULL THEN ${TransactionEntityTable.yieldSourceAccountId}
            WHEN ${landingHoldsPositionSql} THEN ${AccountEntityTable.id}
            ELSE NULL
        END`;
        const scopeInstrumentIdSql = sql<number>`COALESCE(${yieldSourceAccount.instrumentId}, ${AccountEntityTable.instrumentId})`;

        const buildEstimatedSql = (baseInstrumentId: number) => sql<number>`CASE
            WHEN (${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} OR ${eq(InstrumentEntityTable.type, InstrumentTypeEnum.FUND)})
             AND (${TransactionEntryEntityTable.baseInstrumentId} IS NULL
                  OR ${TransactionEntryEntityTable.baseInstrumentId} != ${baseInstrumentId}
                  OR ${TransactionEntryEntityTable.baseExchangeRate} IS NULL)
            THEN 1
            ELSE 0
        END`;

        const buildYieldKindCondition = () =>
            and(isNotNull(TransactionEntityTable.yieldKind), ne(TransactionEntityTable.yieldKind, YieldKindEnum.NONE));

        const buildYieldKindIndexCondition = () =>
            sql`${TransactionEntityTable.id} IN (SELECT id FROM ${TransactionEntityTable} WHERE ${buildYieldKindCondition()})`;

        const buildYieldLandingEntryCondition = () =>
            or(
                and(
                    eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                    eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT)
                ),
                and(
                    eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                    eq(TransactionEntityTable.yieldKind, YieldKindEnum.TAX),
                    eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
                )
            );

        const buildYieldScopeCondition = ({ positionAccountId, instrumentId }: YieldScopeInterface): SQL[] => [
            ...(isDefined(positionAccountId) ? [sql`${positionAccountIdSql} = ${positionAccountId}`] : []),
            ...(isDefined(instrumentId) ? [sql`${scopeInstrumentIdSql} = ${instrumentId}`] : [])
        ];

        const buildYieldFactWhere = (scope: YieldScopeInterface, extra: SQL[] = []) =>
            and(
                transactionFilters.buildVisibleTransactionCondition(),
                buildYieldKindIndexCondition(),
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                buildYieldLandingEntryCondition(),
                ...buildYieldScopeCondition(scope),
                ...extra
            );

        const joinYieldLegs = <TQuery extends SQLiteEffectSelect>(query: TQuery) =>
            query
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .innerJoin(InstrumentEntityTable, eq(AccountEntityTable.instrumentId, InstrumentEntityTable.id))
                .leftJoin(yieldSourceAccount, eq(yieldSourceAccount.id, TransactionEntityTable.yieldSourceAccountId));

        return {
            hasYield: Db.query(db =>
                db
                    .select({ id: TransactionEntityTable.id })
                    .from(TransactionEntityTable)
                    .where(and(transactionFilters.buildVisibleTransactionCondition(), buildYieldKindCondition()))
                    .limit(1)
            ).pipe(Effect.map(isNotEmptyArray)),

            hasYieldFor: (scope: YieldScopeInterface) =>
                Db.query(db =>
                    joinYieldLegs(db.select({ id: TransactionEntityTable.id }).from(TransactionEntityTable).$dynamic())
                        .where(buildYieldFactWhere(scope))
                        .limit(1)
                ).pipe(Effect.map(isNotEmptyArray)),

            findFacts: (scope: YieldScopeInterface, baseInstrumentId: number) =>
                Db.query(db =>
                    joinYieldLegs(
                        db
                            .select({
                                transactionId: TransactionEntityTable.id,
                                transactionType: TransactionEntityTable.type,
                                yieldKind: sql<YieldKindEnum>`${TransactionEntityTable.yieldKind}`,
                                operatedAt: TransactionEntityTable.operatedAt,
                                amount: TransactionEntryEntityTable.amount,
                                baseValue: sql<number>`COALESCE(${buildEntryBaseValueSql(baseInstrumentId)}, 0)`,
                                estimated: buildEstimatedSql(baseInstrumentId),
                                landingAccountId: AccountEntityTable.id,
                                landingInstrumentId: AccountEntityTable.instrumentId,
                                landingInstrumentCode: InstrumentEntityTable.code,
                                landingInstrumentType: InstrumentEntityTable.type,
                                positionAccountId: positionAccountIdSql
                            })
                            .from(TransactionEntityTable)
                            .$dynamic()
                    )
                        .where(buildYieldFactWhere(scope))
                        .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntityTable.id))
                ).pipe(
                    Effect.map(rows =>
                        rows.map(({ estimated, ...row }): YieldFactRowInterface => ({
                            ...row,
                            isEstimated: isPositiveNumber(estimated)
                        }))
                    )
                ),
            findPositions: (attributedAccountIds: readonly number[], ratedScope: YieldScopeInterface) =>
                Db.query(db =>
                    db
                        .select({
                            id: AccountEntityTable.id,
                            title: AccountEntityTable.title,
                            type: AccountEntityTable.type,
                            isActive: AccountEntityTable.isActive,
                            deletedAt: AccountEntityTable.deletedAt,
                            interestRate: AccountEntityTable.interestRate,
                            deadline: AccountEntityTable.deadline,
                            instrumentId: AccountEntityTable.instrumentId,
                            instrumentCode: InstrumentEntityTable.code,
                            instrumentSymbol: InstrumentEntityTable.symbol,
                            instrumentType: InstrumentEntityTable.type
                        })
                        .from(AccountEntityTable)
                        .innerJoin(InstrumentEntityTable, eq(AccountEntityTable.instrumentId, InstrumentEntityTable.id))
                        .where(
                            or(
                                ...(isNotEmptyArray(attributedAccountIds)
                                    ? [inArray(AccountEntityTable.id, [...attributedAccountIds])]
                                    : []),
                                and(
                                    isNull(AccountEntityTable.deletedAt),
                                    eq(AccountEntityTable.isActive, true),
                                    inArray(AccountEntityTable.type, RATED_ACCOUNT_TYPES),
                                    gt(AccountEntityTable.interestRate, 0),
                                    ...(isDefined(ratedScope.positionAccountId)
                                        ? [eq(AccountEntityTable.id, ratedScope.positionAccountId)]
                                        : []),
                                    ...(isDefined(ratedScope.instrumentId)
                                        ? [eq(AccountEntityTable.instrumentId, ratedScope.instrumentId)]
                                        : [])
                                )
                            )
                        )
                ),

            findPositionMovements: (accountIds: readonly number[]) =>
                isNotEmptyArray(accountIds)
                    ? Db.query(db =>
                          db
                              .select({
                                  accountId: TransactionEntryEntityTable.accountId,
                                  operatedAt: TransactionEntityTable.operatedAt,
                                  amount: sql<number>`CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount} ELSE -${TransactionEntryEntityTable.amount} END`
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
                      )
                    : Effect.succeed(NO_MOVEMENTS),

            findPayouts: (query: YieldPayoutQueryInterface) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        with: transactionFilters.buildFullTransactionRelations(query.language),
                        where: {
                            RAW: (transactionTable, { inArray: inTransactionIds }) =>
                                inTransactionIds(
                                    transactionTable.id,
                                    joinYieldLegs(
                                        db.select({ id: TransactionEntityTable.id }).from(TransactionEntityTable).$dynamic()
                                    ).where(
                                        buildYieldFactWhere(query.scope, [
                                            ...(isNotEmptyArray(query.kinds)
                                                ? [inArray(TransactionEntityTable.yieldKind, [...query.kinds])]
                                                : []),
                                            ...(query.isUnassignedOnly ? [sql`${positionAccountIdSql} IS NULL`] : [])
                                        ])
                                    )
                                )
                        },
                        orderBy: (transaction, { desc }) => [desc(transaction.operatedAt), desc(transaction.id)],
                        limit: query.limit
                    })
                )
        };
    })
}) {
    static readonly layer = Layer.effect(YieldRepository, YieldRepository.make);
}
