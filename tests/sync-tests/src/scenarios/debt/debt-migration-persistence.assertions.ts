import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    CategorySourceEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { getDebtMigrationPersistedSnapshot } from './utils/get-debt-migration-persisted-snapshot.util';

import type {
    DebtMigrationFirstExecutionSnapshotInterface,
    DebtMigrationPersistedSnapshotInterface
} from './interface/debt-migration-persisted-snapshot.interface';
import type { AccountBalanceEntityInterface, DB } from '@budgie/contracts';

export class DebtMigrationPersistenceAssertions {
    private static readonly AMBIGUOUS_ACCOUNT_ID = Number('102');
    private static readonly AMBIGUOUS_ADJUSTMENT_AMOUNT = 1_000_000_000;
    private static readonly AMBIGUOUS_ADJUSTMENT_TRANSACTION_ID = Number('1010');
    private static readonly AMBIGUOUS_OPENING_AMOUNT = Number('10000000000');
    private static readonly CANONICAL_ACCOUNT_ID = Number('101');
    private static readonly CANONICAL_ADJUSTMENT_ENTRY_ID = Number('2000');
    private static readonly CANONICAL_ADJUSTMENT_TRANSACTION_ID = Number('1000');
    private static readonly CANONICAL_CASH_ENTRY_ID = Number('2014');
    private static readonly CANONICAL_MANUAL_CLOSE_AMOUNT = Number('4100000000');
    private static readonly CANONICAL_OPEN_AMOUNT = Number('45000000000');
    private static readonly CANONICAL_TRANSACTION_CLOSE_AMOUNT = Number('3966000000');
    private static readonly CANONICAL_TRANSACTION_ENTRY_ID = Number('2015');
    private static readonly CANONICAL_TRANSACTION_ID = Number('1007');
    private static readonly REPAIR_MIGRATION_TIMESTAMP = 1_784_131_200;

    constructor(private readonly db: DB) {}

    async assert(): Promise<DebtMigrationFirstExecutionSnapshotInterface> {
        const canonical = await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationPersistenceAssertions.CANONICAL_ACCOUNT_ID);
        const ambiguous = await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationPersistenceAssertions.AMBIGUOUS_ACCOUNT_ID);

        this.assertCanonicalPersistedRows(canonical);
        this.assertAmbiguousPersistedRows(ambiguous);
        await this.assertNoLiveCachedBalance();

        return { ambiguous, canonical };
    }

    private assertCanonicalPersistedRows(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        const liveEvents = snapshot.debtEvents.filter(debtEvent => !isDefined(debtEvent.deletedAt));
        const closingEvents = liveEvents.filter(debtEvent => debtEvent.direction === DebtEventDirectionEnum.CLOSE);
        const transactionClosingEvents = closingEvents.filter(debtEvent => isDefined(debtEvent.transactionId));

        expect(snapshot.accounts).toHaveLength(1);
        expect(snapshot.balances).toHaveLength(0);
        this.assertCanonicalEventTotals(liveEvents, closingEvents, transactionClosingEvents);
        this.assertCanonicalAdjustmentRetired(snapshot);
        this.assertCanonicalTransactionRows(snapshot, transactionClosingEvents);
    }

    private assertCanonicalAdjustmentRetired(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(
            snapshot.transactions.find(
                transaction => transaction.id === DebtMigrationPersistenceAssertions.CANONICAL_ADJUSTMENT_TRANSACTION_ID
            )
        ).toEqual(
            expect.objectContaining({
                deletedAt: DebtMigrationPersistenceAssertions.REPAIR_MIGRATION_TIMESTAMP,
                id: DebtMigrationPersistenceAssertions.CANONICAL_ADJUSTMENT_TRANSACTION_ID,
                updatedAt: DebtMigrationPersistenceAssertions.REPAIR_MIGRATION_TIMESTAMP
            })
        );
        expect(
            snapshot.transactionEntries.find(
                transactionEntry => transactionEntry.id === DebtMigrationPersistenceAssertions.CANONICAL_ADJUSTMENT_ENTRY_ID
            )
        ).toEqual(
            expect.objectContaining({
                deletedAt: DebtMigrationPersistenceAssertions.REPAIR_MIGRATION_TIMESTAMP,
                id: DebtMigrationPersistenceAssertions.CANONICAL_ADJUSTMENT_ENTRY_ID,
                updatedAt: DebtMigrationPersistenceAssertions.REPAIR_MIGRATION_TIMESTAMP
            })
        );
    }

    private assertCanonicalEventTotals(
        liveEvents: DebtMigrationPersistedSnapshotInterface['debtEvents'],
        closingEvents: DebtMigrationPersistedSnapshotInterface['debtEvents'],
        transactionClosingEvents: DebtMigrationPersistedSnapshotInterface['debtEvents']
    ): void {
        const openingEvents = liveEvents.filter(debtEvent => debtEvent.direction === DebtEventDirectionEnum.OPEN);
        const manualClosingEvents = closingEvents.filter(debtEvent => debtEvent.source === DebtEventSourceEnum.MANUAL);

        expect(openingEvents).toHaveLength(1);
        expect(openingEvents[0]?.amount).toBe(DebtMigrationPersistenceAssertions.CANONICAL_OPEN_AMOUNT);
        expect(manualClosingEvents).toEqual([
            expect.objectContaining({
                amount: DebtMigrationPersistenceAssertions.CANONICAL_MANUAL_CLOSE_AMOUNT,
                baseAmount: 3_772_000_000,
                baseExchangeRate: 0.92,
                baseInstrumentId: 2,
                debtAccountId: DebtMigrationPersistenceAssertions.CANONICAL_ACCOUNT_ID,
                direction: DebtEventDirectionEnum.CLOSE,
                source: DebtEventSourceEnum.MANUAL,
                transactionEntryId: null,
                transactionId: null
            })
        ]);
        expect(transactionClosingEvents).toHaveLength(7);
        expect(transactionClosingEvents.reduce((total, debtEvent) => total + debtEvent.amount, 0)).toBe(
            DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_CLOSE_AMOUNT
        );
        expect(transactionClosingEvents.map(debtEvent => debtEvent.transactionId).sort()).toEqual(
            ['1001', '1002', '1003', '1004', '1005', '1006', '1007'].map(Number)
        );
        expect(closingEvents.reduce((total, debtEvent) => total + debtEvent.amount, 0)).toBe(
            DebtMigrationPersistenceAssertions.CANONICAL_MANUAL_CLOSE_AMOUNT +
                DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_CLOSE_AMOUNT
        );
        expect(
            new Set(liveEvents.map(debtEvent => [debtEvent.debtAccountId, debtEvent.transactionId, debtEvent.direction].join(':'))).size
        ).toBe(liveEvents.length);
    }

    private assertCanonicalTransactionRows(
        snapshot: DebtMigrationPersistedSnapshotInterface,
        transactionClosingEvents: DebtMigrationPersistedSnapshotInterface['debtEvents']
    ): void {
        const canonicalTransaction = snapshot.transactions.find(
            transaction => transaction.id === DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ID
        );
        const cashEntry = snapshot.transactionEntries.find(
            transactionEntry => transactionEntry.id === DebtMigrationPersistenceAssertions.CANONICAL_CASH_ENTRY_ID
        );
        const debtEntry = snapshot.transactionEntries.find(
            transactionEntry => transactionEntry.id === DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ENTRY_ID
        );
        const canonicalEvent = transactionClosingEvents.find(
            debtEvent => debtEvent.transactionId === DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ID
        );

        expect(canonicalTransaction).toEqual(
            expect.objectContaining({
                deletedAt: null,
                fromAccountId: 100,
                id: DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ID,
                toAccountId: null,
                type: TransactionTypeEnum.EXPENSE
            })
        );
        expect(cashEntry).toEqual(
            expect.objectContaining({
                accountId: 100,
                categoryId: 10,
                deletedAt: null,
                id: DebtMigrationPersistenceAssertions.CANONICAL_CASH_ENTRY_ID,
                kind: TransactionEntryKindEnum.PRIMARY,
                type: TransactionEntryTypeEnum.CREDIT
            })
        );
        this.assertCanonicalDebtEntry(debtEntry);
        expect(canonicalEvent).toEqual(
            expect.objectContaining({
                amount: 471_000_000,
                baseAmount: debtEntry?.baseAmount,
                baseExchangeRate: debtEntry?.baseExchangeRate,
                baseInstrumentId: debtEntry?.baseInstrumentId,
                debtAccountId: DebtMigrationPersistenceAssertions.CANONICAL_ACCOUNT_ID,
                deletedAt: null,
                direction: DebtEventDirectionEnum.CLOSE,
                source: DebtEventSourceEnum.MIGRATION,
                transactionEntryId: DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ENTRY_ID,
                transactionId: DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ID
            })
        );
    }

    private assertCanonicalDebtEntry(debtEntry: DebtMigrationPersistedSnapshotInterface['transactionEntries'][number] | undefined): void {
        expect(debtEntry).toEqual(
            expect.objectContaining({
                accountId: DebtMigrationPersistenceAssertions.CANONICAL_ACCOUNT_ID,
                baseAmount: 433_320_000,
                baseExchangeRate: 0.92,
                baseInstrumentId: 2,
                categoryId: 10,
                categorySource: CategorySourceEnum.USER,
                id: DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ENTRY_ID,
                kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
                transactionId: DebtMigrationPersistenceAssertions.CANONICAL_TRANSACTION_ID,
                type: TransactionEntryTypeEnum.DEBIT
            })
        );
        expect(debtEntry?.deletedAt).toBeTypeOf('number');
    }

    private assertAmbiguousPersistedRows(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        this.assertAmbiguousAccountAndBalance(snapshot);
        this.assertAmbiguousAdjustment(snapshot);
        this.assertAmbiguousEvents(snapshot);
    }

    private assertAmbiguousAccountAndBalance(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(snapshot.accounts).toEqual([
            {
                createdAt: 1_780_358_400,
                debtType: AccountDebtTypeEnum.BORROW,
                deletedAt: null,
                id: DebtMigrationPersistenceAssertions.AMBIGUOUS_ACCOUNT_ID,
                instrumentId: 1,
                targetBalance: DebtMigrationPersistenceAssertions.AMBIGUOUS_OPENING_AMOUNT,
                targetBaseAmount: 9_200_000_000,
                targetBaseExchangeRate: 0.92,
                targetBaseInstrumentId: 2,
                type: AccountTypeEnum.DEBT,
                updatedAt: 1_780_358_400
            }
        ]);
        expect(snapshot.balances).toEqual([
            {
                accountId: DebtMigrationPersistenceAssertions.AMBIGUOUS_ACCOUNT_ID,
                amount: DebtMigrationPersistenceAssertions.AMBIGUOUS_ADJUSTMENT_AMOUNT,
                createdAt: 1_780_358_400,
                deletedAt: null,
                id: 100,
                updatedAt: 1_780_358_400
            }
        ]);
    }

    private assertAmbiguousAdjustment(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(snapshot.transactions).toEqual([
            expect.objectContaining({
                deletedAt: null,
                fromAccountId: null,
                id: DebtMigrationPersistenceAssertions.AMBIGUOUS_ADJUSTMENT_TRANSACTION_ID,
                toAccountId: DebtMigrationPersistenceAssertions.AMBIGUOUS_ACCOUNT_ID,
                type: TransactionTypeEnum.ADJUSTMENT
            })
        ]);
        expect(snapshot.transactionEntries).toEqual([
            expect.objectContaining({
                accountId: DebtMigrationPersistenceAssertions.AMBIGUOUS_ACCOUNT_ID,
                amount: DebtMigrationPersistenceAssertions.AMBIGUOUS_ADJUSTMENT_AMOUNT,
                baseAmount: 920_000_000,
                baseExchangeRate: 0.92,
                baseInstrumentId: 2,
                categoryId: null,
                deletedAt: null,
                id: 2016,
                kind: TransactionEntryKindEnum.PRIMARY,
                transactionId: DebtMigrationPersistenceAssertions.AMBIGUOUS_ADJUSTMENT_TRANSACTION_ID,
                type: TransactionEntryTypeEnum.DEBIT
            })
        ]);
    }

    private assertAmbiguousEvents(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(
            snapshot.debtEvents.map(debtEvent => ({
                amount: debtEvent.amount,
                baseAmount: debtEvent.baseAmount,
                baseExchangeRate: debtEvent.baseExchangeRate,
                baseInstrumentId: debtEvent.baseInstrumentId,
                deletedAt: debtEvent.deletedAt,
                direction: debtEvent.direction,
                source: debtEvent.source,
                transactionEntryId: debtEvent.transactionEntryId,
                transactionId: debtEvent.transactionId
            }))
        ).toEqual([
            {
                amount: DebtMigrationPersistenceAssertions.AMBIGUOUS_ADJUSTMENT_AMOUNT,
                baseAmount: 920_000_000,
                baseExchangeRate: 0.92,
                baseInstrumentId: 2,
                deletedAt: null,
                direction: DebtEventDirectionEnum.CLOSE,
                source: DebtEventSourceEnum.MANUAL,
                transactionEntryId: null,
                transactionId: null
            },
            {
                amount: DebtMigrationPersistenceAssertions.AMBIGUOUS_OPENING_AMOUNT,
                baseAmount: 9_200_000_000,
                baseExchangeRate: 0.92,
                baseInstrumentId: 2,
                deletedAt: null,
                direction: DebtEventDirectionEnum.OPEN,
                source: DebtEventSourceEnum.MANUAL,
                transactionEntryId: null,
                transactionId: null
            }
        ]);
    }

    private async assertNoLiveCachedBalance(): Promise<void> {
        expect(
            await this.db.$client.getAllAsync<Pick<AccountBalanceEntityInterface, 'id'>>(
                'SELECT id FROM account_balances WHERE account_id = ? AND deleted_at IS NULL',
                [DebtMigrationPersistenceAssertions.CANONICAL_ACCOUNT_ID]
            )
        ).toHaveLength(0);
    }
}
