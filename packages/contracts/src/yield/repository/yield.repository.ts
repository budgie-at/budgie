import { and, asc, eq, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';
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

import type { DB } from '../../@generic/type/db.type';
import type { YieldFactRowInterface } from '../interface/yield-fact-row.interface';
import type { YieldScopeInterface } from '../interface/yield-scope.interface';
import type { SQL } from 'drizzle-orm';

export class YieldRepository extends Context.Service<YieldRepository>()('@budgie/contracts/YieldRepository', {
    make: Effect.sync(() => {
        const POSITION_ACCOUNT_TYPES = [AccountTypeEnum.DEPOSIT, AccountTypeEnum.SAVINGS, ...CRYPTO_ACCOUNT_TYPES, AccountTypeEnum.STOCKS];
        const PROBE_BASE_INSTRUMENT_ID = 0;
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
                sql`${TransactionEntityTable.id} IN (SELECT id FROM ${TransactionEntityTable} WHERE ${buildYieldKindCondition()})`,
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                buildYieldLandingEntryCondition(),
                ...buildYieldScopeCondition(scope),
                ...extra
            );

        const selectFactRows = (db: DB, baseInstrumentId: number) =>
            db
                .select({
                    transactionId: TransactionEntityTable.id,
                    transactionType: TransactionEntityTable.type,
                    yieldKind: sql<YieldKindEnum>`${TransactionEntityTable.yieldKind}`,
                    operatedAt: TransactionEntityTable.operatedAt,
                    amount: TransactionEntryEntityTable.amount,
                    baseValue: sql<number>`${buildEntryBaseValueSql(baseInstrumentId)}`,
                    estimated: buildEstimatedSql(baseInstrumentId),
                    landingAccountId: AccountEntityTable.id,
                    landingInstrumentId: AccountEntityTable.instrumentId,
                    landingInstrumentCode: InstrumentEntityTable.code,
                    landingInstrumentType: InstrumentEntityTable.type,
                    positionAccountId: positionAccountIdSql
                })
                .from(TransactionEntityTable)
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
                Db.query(db => selectFactRows(db, PROBE_BASE_INSTRUMENT_ID).where(buildYieldFactWhere(scope)).limit(1)).pipe(
                    Effect.map(isNotEmptyArray)
                ),

            findFacts: (scope: YieldScopeInterface, baseInstrumentId: number) =>
                Db.query(db =>
                    selectFactRows(db, baseInstrumentId)
                        .where(buildYieldFactWhere(scope))
                        .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntityTable.id))
                ).pipe(
                    Effect.map(rows =>
                        rows.map(({ estimated, ...row }): YieldFactRowInterface => ({
                            ...row,
                            isEstimated: isPositiveNumber(estimated)
                        }))
                    )
                )
        };
    })
}) {
    static readonly layer = Layer.effect(YieldRepository, YieldRepository.make);
}
