import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { PRECISION } from '../../@generic/constant/precision.constant';
import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { CRYPTO_ACCOUNT_TYPES } from '../../account/constant/crypto-account-types.constant';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { isUnitAccountSql } from '../../account/utils/is-unit-account-sql.util';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { InstrumentPositionEntryRowInterface } from '../interface/instrument-position-entry-row.interface';

export class TransactionEntryPositionRepository extends Context.Service<TransactionEntryPositionRepository>()(
    '@budgie/contracts/TransactionEntryPositionRepository',
    {
        make: Effect.sync(() => {
            const POSITION_ENTRY_TYPES = [
                TransactionEntryTypeEnum.DEBIT,
                TransactionEntryTypeEnum.CREDIT,
                TransactionEntryTypeEnum.FEE
            ] as const;

            return {
                findCashReturn: (accountIds: readonly number[], baseInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({
                                amount: sql<number>`COALESCE(SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.baseAmount} ELSE -${TransactionEntryEntityTable.baseAmount} END), 0) * 1.0 / ${PRECISION}`
                            })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                            .where(
                                and(
                                    inArray(AccountEntityTable.id, accountIds),
                                    eq(TransactionEntryEntityTable.baseInstrumentId, baseInstrumentId),
                                    inArray(TransactionEntityTable.type, [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE]),
                                    transactionFilters.buildLedgerEntryCondition(),
                                    isNull(AccountEntityTable.deletedAt),
                                    isNull(TransactionEntityTable.deletedAt)
                                )
                            )
                    ).pipe(Effect.map(([row]) => row.amount)),

                findInstrumentPositionEntries: (instrumentId: number, baseInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({
                                type: TransactionEntryEntityTable.type,
                                isAdjustment: sql<boolean>`${TransactionEntityTable.type} = ${TransactionTypeEnum.ADJUSTMENT}`.mapWith(
                                    Boolean
                                ),
                                accountId: AccountEntityTable.id,
                                transferAccountId: sql<number | null>`(
                                    SELECT opposite.account_id FROM transaction_entries opposite
                                    INNER JOIN accounts destination ON destination.id = opposite.account_id
                                    WHERE ${TransactionEntityTable.type} = ${TransactionTypeEnum.TRANSFER}
                                      AND ${TransactionEntryEntityTable.type} IN (${TransactionEntryTypeEnum.DEBIT}, ${TransactionEntryTypeEnum.CREDIT})
                                      AND opposite.transaction_id = ${TransactionEntryEntityTable.transactionId}
                                      AND opposite.type IN (${TransactionEntryTypeEnum.DEBIT}, ${TransactionEntryTypeEnum.CREDIT})
                                      AND opposite.type != ${TransactionEntryEntityTable.type}
                                      AND opposite.deleted_at IS NULL AND opposite.original_transaction_id IS NULL
                                      AND destination.deleted_at IS NULL
                                      AND ${isUnitAccountSql(sql`destination.type`, sql`destination.instrument_id`)}
                                      AND destination.instrument_id = ${instrumentId}
                                    LIMIT 1
                                )`,
                                amount: TransactionEntryEntityTable.amount,
                                feeBaseAmount: sql<
                                    number | null
                                >`(SELECT SUM(fee.base_amount) FROM transaction_entries fee INNER JOIN accounts fee_account ON fee_account.id = fee.account_id WHERE fee.transaction_id = ${TransactionEntryEntityTable.transactionId} AND fee.type = ${TransactionEntryTypeEnum.FEE} AND fee.base_instrument_id = ${baseInstrumentId} AND fee.deleted_at IS NULL AND fee.original_transaction_id IS NULL AND fee_account.instrument_id != ${instrumentId})`,
                                baseAmount: sql<InstrumentPositionEntryRowInterface['baseAmount']>`
                        CASE
                            WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.ADJUSTMENT}
                            THEN CASE WHEN ${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN NULL ELSE 0 END
                            WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${baseInstrumentId}
                             AND ${TransactionEntityTable.type} != ${TransactionTypeEnum.ADJUSTMENT}
                            THEN ${TransactionEntryEntityTable.baseAmount}
                            ELSE NULL
                        END
                    `
                            })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                            .where(
                                and(
                                    isUnitAccountSql(),
                                    eq(AccountEntityTable.instrumentId, instrumentId),
                                    isNull(AccountEntityTable.deletedAt),
                                    isNull(TransactionEntityTable.deletedAt),
                                    isNull(TransactionEntryEntityTable.deletedAt),
                                    inArray(TransactionEntryEntityTable.type, POSITION_ENTRY_TYPES),
                                    transactionFilters.buildRefundAwareLedgerEntryCondition()
                                )
                            )
                            .orderBy(
                                asc(TransactionEntityTable.operatedAt),
                                asc(TransactionEntityTable.id),
                                asc(TransactionEntryEntityTable.id)
                            )
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionEntryPositionRepository, TransactionEntryPositionRepository.make);
}
