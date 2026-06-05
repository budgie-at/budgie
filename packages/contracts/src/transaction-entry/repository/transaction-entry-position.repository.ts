import { and, asc, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { CryptoPositionEntryRowInterface } from '../interface/crypto-position-entry-row.interface';

export class TransactionEntryPositionRepository {
    private static readonly POSITION_ENTRY_TYPES = [
        TransactionEntryTypeEnum.DEBIT,
        TransactionEntryTypeEnum.CREDIT,
        TransactionEntryTypeEnum.FEE
    ] as const;

    constructor(private db: DB) {}

    findCryptoPositionEntries(instrumentId: number, baseInstrumentId: number) {
        return this.db
            .select({
                type: TransactionEntryEntityTable.type,
                amount: TransactionEntryEntityTable.amount,
                baseAmount: sql<CryptoPositionEntryRowInterface['baseAmount']>`
                    CASE
                        WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${baseInstrumentId}
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
                    inArray(TransactionEntryEntityTable.type, TransactionEntryPositionRepository.POSITION_ENTRY_TYPES),
                    this.buildPositionLedgerEntryCondition(),
                    this.buildExternalCryptoPositionEntryCondition(instrumentId)
                )
            )
            .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntityTable.id), asc(TransactionEntryEntityTable.id));
    }

    private buildPositionLedgerEntryCondition() {
        return or(
            isNull(TransactionEntryEntityTable.originalTransactionId),
            sql`
                EXISTS (
                    SELECT 1
                    FROM transactions ledger_transaction
                    WHERE ledger_transaction.id = ${TransactionEntryEntityTable.transactionId}
                      AND ledger_transaction.consolidation_type = ${TransactionConsolidationTypeEnum.REFUND}
                      AND ledger_transaction.deleted_at IS NULL
                )
            `
        );
    }

    private buildExternalCryptoPositionEntryCondition(instrumentId: number) {
        return sql`
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
    }
}
