import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { CryptoPositionEntryRowInterface } from '../interface/crypto-position-entry-row.interface';

export class TransactionEntryPositionRepository extends Context.Service<TransactionEntryPositionRepository>()(
    '@budgie/contracts/TransactionEntryPositionRepository',
    {
        make: Effect.sync(() => {
            const POSITION_ENTRY_TYPES = [
                TransactionEntryTypeEnum.DEBIT,
                TransactionEntryTypeEnum.CREDIT,
                TransactionEntryTypeEnum.FEE
            ] as const;

            const buildExternalCryptoPositionEntryCondition = (instrumentId: number) =>
                sql`
            (
                ${TransactionEntityTable.type} != ${TransactionTypeEnum.TRANSFER}
                OR ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE}
                OR NOT EXISTS (
                    SELECT 1
                    FROM transaction_entries opposite_entry
                    INNER JOIN accounts opposite_account ON opposite_account.id = opposite_entry.account_id
                    WHERE opposite_entry.transaction_id = ${TransactionEntryEntityTable.transactionId}
                      AND opposite_entry.id != ${TransactionEntryEntityTable.id}
                      AND opposite_entry.deleted_at IS NULL
                      AND opposite_entry.original_transaction_id IS NULL
                      AND opposite_account.deleted_at IS NULL
                      AND opposite_account.type = ${AccountTypeEnum.CRYPTO}
                      AND opposite_account.instrument_id = ${instrumentId}
                      AND opposite_entry.type IN (${TransactionEntryTypeEnum.DEBIT}, ${TransactionEntryTypeEnum.CREDIT})
                      AND opposite_entry.type != ${TransactionEntryEntityTable.type}
                )
            )
        `;

            return {
                findCryptoPositionEntries: (instrumentId: number, baseInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({
                                type: TransactionEntryEntityTable.type,
                                amount: TransactionEntryEntityTable.amount,
                                baseAmount: sql<CryptoPositionEntryRowInterface['baseAmount']>`
                        CASE
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
                                    eq(AccountEntityTable.type, AccountTypeEnum.CRYPTO),
                                    eq(AccountEntityTable.instrumentId, instrumentId),
                                    eq(AccountEntityTable.isActive, true),
                                    isNull(AccountEntityTable.deletedAt),
                                    isNull(TransactionEntityTable.deletedAt),
                                    isNull(TransactionEntryEntityTable.deletedAt),
                                    inArray(TransactionEntryEntityTable.type, POSITION_ENTRY_TYPES),
                                    transactionFilters.buildRefundAwareLedgerEntryCondition(),
                                    buildExternalCryptoPositionEntryCondition(instrumentId)
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
