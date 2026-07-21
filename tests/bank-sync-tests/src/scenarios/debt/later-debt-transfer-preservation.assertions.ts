import {
    CategorySourceEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import type { LaterDebtTransferSnapshotInterface } from './interface/later-debt-transfer-snapshot.interface';
import type { DB } from '@budgie/contracts';
import type Database from 'better-sqlite3';

export class LaterDebtTransferPreservationAssertions {
    private static readonly DEBT_EVENT_ID = Number('100');
    private static readonly DEBT_ENTRY_ID = Number('2101');
    private static readonly IMMUTABLE_TIMESTAMP = Number('1783623600');
    private static readonly MANUAL_CLOSE_AMOUNT = Number('4100000000');
    private static readonly OPERATED_AT = Number('1780963200');
    private static readonly TRANSACTION_ID = Number('1100');

    private static readonly TRANSACTION_SQL =
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, type, title, external_id AS externalId, operated_at AS operatedAt, comment, to_account_id AS toAccountId, from_account_id AS fromAccountId, exchange_rate AS exchangeRate, external_source AS externalSource, needs_embedding AS needsEmbedding, consolidation_parent_transaction_id AS consolidationParentTransactionId, consolidation_type AS consolidationType, updated_by AS updatedBy FROM transactions WHERE id = 1100';

    private static readonly TRANSACTION_ENTRIES_SQL =
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, type, account_id AS accountId, category_id AS categoryId, transaction_id AS transactionId, amount, external_id AS externalId, mcc_category_id AS mccCategoryId, exchange_rate AS exchangeRate, to_iban AS toIban, original_transaction_id AS originalTransactionId, category_source AS categorySource, base_instrument_id AS baseInstrumentId, base_exchange_rate AS baseExchangeRate, base_amount AS baseAmount, kind FROM transaction_entries WHERE transaction_id = 1100 ORDER BY id';

    private static readonly DEBT_EVENT_SQL =
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, debt_account_id AS debtAccountId, transaction_id AS transactionId, transaction_entry_id AS transactionEntryId, direction, source, amount, base_instrument_id AS baseInstrumentId, base_exchange_rate AS baseExchangeRate, base_amount AS baseAmount, operated_at AS operatedAt FROM debt_events WHERE id = 100';

    snapshot(sqlite: Database.Database): LaterDebtTransferSnapshotInterface {
        const transaction = sqlite
            .prepare<[], LaterDebtTransferSnapshotInterface['transaction']>(LaterDebtTransferPreservationAssertions.TRANSACTION_SQL)
            .get();
        const transactionEntries = sqlite
            .prepare<[], LaterDebtTransferSnapshotInterface['transactionEntries'][number]>(
                LaterDebtTransferPreservationAssertions.TRANSACTION_ENTRIES_SQL
            )
            .all();
        const debtEvent = sqlite
            .prepare<[], LaterDebtTransferSnapshotInterface['debtEvent']>(LaterDebtTransferPreservationAssertions.DEBT_EVENT_SQL)
            .get();
        const snapshot = {
            debtEvent: this.requireRow(debtEvent, 'Later debt event was not found in the generated fixture'),
            transaction: this.requireRow(transaction, 'Later debt transaction was not found in the generated fixture'),
            transactionEntries
        };

        this.assertFixtureSnapshot(snapshot);

        return snapshot;
    }

    async assert(db: DB, beforeMigration: LaterDebtTransferSnapshotInterface): Promise<void> {
        const afterMigration = await this.readMigratedSnapshot(db);

        await this.assertNotIncludedAsClose(db);
        this.assertTransactionPreserved(beforeMigration, afterMigration);
        this.assertEntriesPreserved(beforeMigration, afterMigration);
        this.assertEventPreserved(beforeMigration, afterMigration);
        await this.assertManualCloseRepaired(db);
    }

    private assertFixtureSnapshot(snapshot: LaterDebtTransferSnapshotInterface): void {
        expect(snapshot.transaction).toEqual({
            comment: 'Must remain an opening transfer',
            consolidationParentTransactionId: null,
            consolidationType: null,
            createdAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP,
            deletedAt: null,
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: 101,
            id: LaterDebtTransferPreservationAssertions.TRANSACTION_ID,
            needsEmbedding: 0,
            operatedAt: LaterDebtTransferPreservationAssertions.OPERATED_AT,
            title: 'Later borrowed principal transfer',
            toAccountId: 100,
            type: TransactionTypeEnum.DEBT,
            updatedAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP,
            updatedBy: null
        });
        this.assertFixtureEntries(snapshot.transactionEntries);
        this.assertFixtureEvent(snapshot.debtEvent);
    }

    private assertFixtureEntries(transactionEntries: LaterDebtTransferSnapshotInterface['transactionEntries']): void {
        expect(transactionEntries).toEqual([
            {
                accountId: 100,
                amount: 10_000_000_000,
                baseAmount: 250_000_000,
                baseExchangeRate: 0.025,
                baseInstrumentId: 2,
                categoryId: 10,
                categorySource: CategorySourceEnum.USER,
                createdAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP,
                deletedAt: null,
                exchangeRate: 1,
                externalId: null,
                id: 2100,
                kind: TransactionEntryKindEnum.PRIMARY,
                mccCategoryId: null,
                originalTransactionId: null,
                toIban: null,
                transactionId: LaterDebtTransferPreservationAssertions.TRANSACTION_ID,
                type: TransactionEntryTypeEnum.DEBIT,
                updatedAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP
            },
            {
                accountId: 101,
                amount: 250_000_000,
                baseAmount: 230_000_000,
                baseExchangeRate: 0.92,
                baseInstrumentId: 2,
                categoryId: null,
                categorySource: CategorySourceEnum.USER,
                createdAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP,
                deletedAt: null,
                exchangeRate: 1,
                externalId: null,
                id: LaterDebtTransferPreservationAssertions.DEBT_ENTRY_ID,
                kind: TransactionEntryKindEnum.PRIMARY,
                mccCategoryId: null,
                originalTransactionId: null,
                toIban: null,
                transactionId: LaterDebtTransferPreservationAssertions.TRANSACTION_ID,
                type: TransactionEntryTypeEnum.CREDIT,
                updatedAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP
            }
        ]);
    }

    private assertFixtureEvent(debtEvent: LaterDebtTransferSnapshotInterface['debtEvent']): void {
        expect(debtEvent).toEqual({
            amount: 250_000_000,
            baseAmount: 230_000_000,
            baseExchangeRate: 0.92,
            baseInstrumentId: 2,
            createdAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP,
            debtAccountId: 101,
            deletedAt: null,
            direction: DebtEventDirectionEnum.OPEN,
            id: LaterDebtTransferPreservationAssertions.DEBT_EVENT_ID,
            operatedAt: LaterDebtTransferPreservationAssertions.OPERATED_AT,
            source: DebtEventSourceEnum.TRANSFER,
            transactionEntryId: LaterDebtTransferPreservationAssertions.DEBT_ENTRY_ID,
            transactionId: LaterDebtTransferPreservationAssertions.TRANSACTION_ID,
            updatedAt: LaterDebtTransferPreservationAssertions.IMMUTABLE_TIMESTAMP
        });
    }

    private async readMigratedSnapshot(db: DB): Promise<LaterDebtTransferSnapshotInterface> {
        const [transaction, transactionEntries, debtEvent] = await Promise.all([
            db.$client.getFirstAsync<LaterDebtTransferSnapshotInterface['transaction']>(
                LaterDebtTransferPreservationAssertions.TRANSACTION_SQL
            ),
            db.$client.getAllAsync<LaterDebtTransferSnapshotInterface['transactionEntries'][number]>(
                LaterDebtTransferPreservationAssertions.TRANSACTION_ENTRIES_SQL
            ),
            db.$client.getFirstAsync<LaterDebtTransferSnapshotInterface['debtEvent']>(
                LaterDebtTransferPreservationAssertions.DEBT_EVENT_SQL
            )
        ]);

        return {
            debtEvent: this.requireRow(debtEvent, 'Later debt event was removed by migration 0036'),
            transaction: this.requireRow(transaction, 'Later debt transaction was removed by migration 0036'),
            transactionEntries
        };
    }

    private async assertNotIncludedAsClose(db: DB): Promise<void> {
        const closingEvents = await db.$client.getAllAsync<{ readonly id: number }>(
            "SELECT id FROM debt_events WHERE transaction_id = 1100 AND direction = 'CLOSE' AND deleted_at IS NULL"
        );

        expect(closingEvents).toHaveLength(0);
    }

    private assertTransactionPreserved(
        beforeMigration: LaterDebtTransferSnapshotInterface,
        afterMigration: LaterDebtTransferSnapshotInterface
    ): void {
        expect(afterMigration.transaction).toEqual(beforeMigration.transaction);
    }

    private assertEntriesPreserved(
        beforeMigration: LaterDebtTransferSnapshotInterface,
        afterMigration: LaterDebtTransferSnapshotInterface
    ): void {
        expect(afterMigration.transactionEntries).toEqual(beforeMigration.transactionEntries);
    }

    private assertEventPreserved(
        beforeMigration: LaterDebtTransferSnapshotInterface,
        afterMigration: LaterDebtTransferSnapshotInterface
    ): void {
        expect(afterMigration.debtEvent).toEqual(beforeMigration.debtEvent);
    }

    private async assertManualCloseRepaired(db: DB): Promise<void> {
        const manualClosingEvents = await db.$client.getAllAsync<{ readonly amount: number }>(
            "SELECT amount FROM debt_events WHERE debt_account_id = 101 AND direction = 'CLOSE' AND source = 'MANUAL' AND deleted_at IS NULL"
        );

        expect(manualClosingEvents).toEqual([{ amount: LaterDebtTransferPreservationAssertions.MANUAL_CLOSE_AMOUNT }]);
    }

    private requireRow<T>(row: T | null | undefined, errorMessage: string): T {
        expect(row).toBeDefined();

        if (!isDefined(row)) {
            throw new Error(errorMessage);
        }

        return row;
    }
}
