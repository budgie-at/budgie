import {
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { expect } from 'vitest';

import { getDebtMigrationPersistedSnapshot } from './utils/get-debt-migration-persisted-snapshot.util';

import type {
    DebtMigrationFirstExecutionSnapshotInterface,
    DebtMigrationPersistedSnapshotInterface
} from './interface/debt-migration-persisted-snapshot.interface';
import type { AccountBalanceEntityInterface, DB } from '@budgie/contracts';

export class DebtMigrationIdempotencyAssertions {
    private static readonly AMBIGUOUS_ACCOUNT_ID = Number('102');
    private static readonly CANONICAL_ACCOUNT_ID = Number('101');
    private static readonly FRESH_ACCOUNT_ID = Number('900101');
    private static readonly FRESH_ADJUSTMENT_AMOUNT = 250_000_000;
    private static readonly FRESH_ADJUSTMENT_ENTRY_ID = Number('900101');
    private static readonly FRESH_ADJUSTMENT_TRANSACTION_ID = Number('900101');
    private static readonly FRESH_CLOSE_EVENT_ID = Number('900102');
    private static readonly FRESH_OPEN_EVENT_ID = Number('900101');
    private static readonly LOOKALIKE_ACCOUNT_ID = Number('900201');
    private static readonly LOOKALIKE_BALANCE_ID = Number('900201');
    private static readonly LOOKALIKE_CLOSE_EVENT_ID = Number('900202');
    private static readonly LOOKALIKE_OPEN_EVENT_ID = Number('900201');
    private static readonly LOOKALIKE_SETTLEMENT_EVENT_ID = Number('900203');
    private static readonly LOOKALIKE_TRANSACTION_ENTRY_ID = Number('900201');
    private static readonly LOOKALIKE_TRANSACTION_ID = Number('900201');
    private static readonly MULTI_ENTRY_ACCOUNT_ID = Number('900301');
    private static readonly MULTI_ENTRY_ADJUSTMENT_AMOUNT = 250_000_000;
    private static readonly MULTI_ENTRY_CASH_ENTRY_ID = Number('900302');
    private static readonly MULTI_ENTRY_CLOSE_EVENT_ID = Number('900302');
    private static readonly MULTI_ENTRY_DEBT_ENTRY_ID = Number('900301');
    private static readonly MULTI_ENTRY_OPEN_EVENT_ID = Number('900301');
    private static readonly MULTI_ENTRY_SETTLEMENT_EVENT_ID = Number('900303');
    private static readonly MULTI_ENTRY_TRANSACTION_ID = Number('900301');

    constructor(private readonly db: DB) {}

    async assert(repairMigrationSql: string, firstExecution: DebtMigrationFirstExecutionSnapshotInterface): Promise<void> {
        await this.insertSentinels();
        const fresh = await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID);
        const lookalike = await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID);
        const multiEntry = await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID);

        this.assertFreshPersistedRows(fresh);
        this.assertLookalikePersistedRows(lookalike);
        this.assertMultiEntryPersistedRows(multiEntry);
        await this.db.$client.execAsync(repairMigrationSql);
        await this.assertSnapshotsUnchanged(firstExecution, fresh, lookalike);
        expect(await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID)).toEqual(
            multiEntry
        );
        await this.assertNoLiveCachedBalance();
    }

    private async assertSnapshotsUnchanged(
        firstExecution: DebtMigrationFirstExecutionSnapshotInterface,
        fresh: DebtMigrationPersistedSnapshotInterface,
        lookalike: DebtMigrationPersistedSnapshotInterface
    ): Promise<void> {
        expect(await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.CANONICAL_ACCOUNT_ID)).toEqual(
            firstExecution.canonical
        );
        expect(await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.AMBIGUOUS_ACCOUNT_ID)).toEqual(
            firstExecution.ambiguous
        );
        expect(await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID)).toEqual(fresh);
        expect(await getDebtMigrationPersistedSnapshot(this.db, DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID)).toEqual(
            lookalike
        );
    }

    private assertFreshPersistedRows(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(snapshot.accounts).toHaveLength(1);
        expect(snapshot.balances).toHaveLength(0);
        expect(snapshot.transactions).toEqual([
            expect.objectContaining({
                deletedAt: null,
                fromAccountId: DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID,
                id: DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_TRANSACTION_ID,
                toAccountId: null,
                type: TransactionTypeEnum.ADJUSTMENT
            })
        ]);
        expect(snapshot.transactionEntries).toEqual([
            expect.objectContaining({
                accountId: DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID,
                amount: DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_AMOUNT,
                deletedAt: null,
                id: DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_ENTRY_ID,
                kind: TransactionEntryKindEnum.PRIMARY,
                type: TransactionEntryTypeEnum.CREDIT
            })
        ]);
        expect(snapshot.debtEvents).toEqual([
            expect.objectContaining({
                amount: 2_000_000_000,
                debtAccountId: DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID,
                deletedAt: null,
                direction: DebtEventDirectionEnum.OPEN,
                id: DebtMigrationIdempotencyAssertions.FRESH_OPEN_EVENT_ID,
                source: DebtEventSourceEnum.MANUAL
            }),
            expect.objectContaining({
                amount: 250_000_000,
                debtAccountId: DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID,
                deletedAt: null,
                direction: DebtEventDirectionEnum.CLOSE,
                id: DebtMigrationIdempotencyAssertions.FRESH_CLOSE_EVENT_ID,
                source: DebtEventSourceEnum.MANUAL
            })
        ]);
    }

    private assertLookalikePersistedRows(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(snapshot.accounts).toHaveLength(1);
        expect(snapshot.balances).toEqual([
            expect.objectContaining({
                accountId: DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID,
                amount: 300_000_000,
                deletedAt: null,
                id: DebtMigrationIdempotencyAssertions.LOOKALIKE_BALANCE_ID
            })
        ]);
        expect(snapshot.transactions).toEqual([
            expect.objectContaining({
                deletedAt: null,
                fromAccountId: DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID,
                id: DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ID,
                toAccountId: null,
                type: TransactionTypeEnum.ADJUSTMENT
            })
        ]);
        expect(snapshot.transactionEntries).toEqual([
            expect.objectContaining({
                accountId: DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID,
                amount: 300_000_000,
                deletedAt: null,
                id: DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ENTRY_ID,
                kind: TransactionEntryKindEnum.PRIMARY,
                type: TransactionEntryTypeEnum.CREDIT
            })
        ]);
        expect(snapshot.debtEvents).toEqual([
            expect.objectContaining({
                amount: 3_000_000_000,
                direction: DebtEventDirectionEnum.OPEN,
                id: DebtMigrationIdempotencyAssertions.LOOKALIKE_OPEN_EVENT_ID,
                source: DebtEventSourceEnum.MANUAL
            }),
            expect.objectContaining({
                amount: 2_700_000_000,
                direction: DebtEventDirectionEnum.CLOSE,
                id: DebtMigrationIdempotencyAssertions.LOOKALIKE_CLOSE_EVENT_ID,
                source: DebtEventSourceEnum.MANUAL
            }),
            expect.objectContaining({
                amount: 300_000_000,
                direction: DebtEventDirectionEnum.OPEN,
                id: DebtMigrationIdempotencyAssertions.LOOKALIKE_SETTLEMENT_EVENT_ID,
                source: DebtEventSourceEnum.MIGRATION,
                transactionEntryId: DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ENTRY_ID,
                transactionId: DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ID
            })
        ]);
    }

    private assertMultiEntryPersistedRows(snapshot: DebtMigrationPersistedSnapshotInterface): void {
        expect(snapshot.accounts).toHaveLength(1);
        expect(snapshot.balances).toHaveLength(0);
        expect(snapshot.transactions).toEqual([
            expect.objectContaining({
                deletedAt: null,
                fromAccountId: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID,
                id: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_TRANSACTION_ID,
                toAccountId: null,
                type: TransactionTypeEnum.ADJUSTMENT
            })
        ]);
        expect(snapshot.transactionEntries).toEqual([
            expect.objectContaining({
                accountId: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID,
                amount: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ADJUSTMENT_AMOUNT,
                deletedAt: null,
                id: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_DEBT_ENTRY_ID,
                originalTransactionId: null,
                type: TransactionEntryTypeEnum.CREDIT
            }),
            expect.objectContaining({
                accountId: 100,
                amount: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ADJUSTMENT_AMOUNT,
                deletedAt: null,
                id: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_CASH_ENTRY_ID,
                originalTransactionId: null,
                type: TransactionEntryTypeEnum.DEBIT
            })
        ]);
        expect(snapshot.debtEvents).toEqual([
            expect.objectContaining({
                amount: 2_000_000_000,
                direction: DebtEventDirectionEnum.OPEN,
                id: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_OPEN_EVENT_ID,
                source: DebtEventSourceEnum.MANUAL
            }),
            expect.objectContaining({
                amount: 1_750_000_000,
                direction: DebtEventDirectionEnum.CLOSE,
                id: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_CLOSE_EVENT_ID,
                source: DebtEventSourceEnum.MANUAL
            }),
            expect.objectContaining({
                amount: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ADJUSTMENT_AMOUNT,
                direction: DebtEventDirectionEnum.OPEN,
                id: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_SETTLEMENT_EVENT_ID,
                source: DebtEventSourceEnum.MIGRATION,
                transactionEntryId: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_DEBT_ENTRY_ID,
                transactionId: DebtMigrationIdempotencyAssertions.MULTI_ENTRY_TRANSACTION_ID
            })
        ]);
    }

    private async assertNoLiveCachedBalance(): Promise<void> {
        expect(
            await this.db.$client.getAllAsync<Pick<AccountBalanceEntityInterface, 'id'>>(
                'SELECT id FROM account_balances WHERE account_id = ? AND deleted_at IS NULL',
                [DebtMigrationIdempotencyAssertions.CANONICAL_ACCOUNT_ID]
            )
        ).toHaveLength(0);
    }

    private async insertSentinels(): Promise<void> {
        await this.db.$client.execAsync(`
            INSERT INTO accounts (
                id, created_at, updated_at, title, type, nature, debt_type, instrument_id, target_balance,
                target_base_instrument_id, target_base_exchange_rate, target_base_amount, include_in_net_worth
            )
            VALUES
                (${DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID}, 1781049600, 1781049600, 'Fresh borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, 2000000000, 2, 0.92, 1840000000, 0),
                (${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, 1781136000, 1781136000, 'Contradictory borrowed lookalike', 'DEBT', 'LIABILITY', 'BORROW', 1, 3000000000, 2, 0.92, 2760000000, 0),
                (${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID}, 1780358400, 1780358400, 'Multi-entry borrowed lookalike', 'DEBT', 'LIABILITY', 'BORROW', 1, 2000000000, 2, 0.92, 1840000000, 0);

            INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
            VALUES (${DebtMigrationIdempotencyAssertions.LOOKALIKE_BALANCE_ID}, 1781136000, 1781136000, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, 300000000);

            INSERT INTO transactions (
                id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate
            )
            VALUES (
                ${DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_TRANSACTION_ID}, 1784131200, 1784131200, 'ADJUSTMENT',
                'Fresh borrowed adjustment', 1784131200, '', ${DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID}, NULL, 1
            ), (
                ${DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ID}, 1781136000, 1781136000, 'ADJUSTMENT',
                'Contradictory borrowed adjustment', 1781136000, '', ${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, NULL, 1
            ), (
                ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_TRANSACTION_ID}, 1780358400, 1780358400, 'ADJUSTMENT',
                'Multi-entry borrowed adjustment', 1780358400, '', ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID}, NULL, 1
            );

            INSERT INTO transaction_entries (
                id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, kind,
                category_source, exchange_rate, original_transaction_id, base_instrument_id, base_exchange_rate, base_amount
            )
            VALUES (
                ${DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_ENTRY_ID}, 1784131200, 1784131200, 'CREDIT',
                ${DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID}, NULL, ${DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_TRANSACTION_ID},
                ${DebtMigrationIdempotencyAssertions.FRESH_ADJUSTMENT_AMOUNT}, 'PRIMARY', 'USER', 1, NULL, 2, 0.92, 230000000
            ), (
                ${DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ENTRY_ID}, 1781136000, 1781136000, 'CREDIT',
                ${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, NULL, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ID},
                300000000, 'PRIMARY', 'USER', 1, NULL, 2, 0.92, 276000000
            ), (
                ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_DEBT_ENTRY_ID}, 1780358400, 1780358400, 'CREDIT',
                ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID}, NULL, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_TRANSACTION_ID},
                ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ADJUSTMENT_AMOUNT}, 'PRIMARY', 'USER', 1, NULL, 2, 0.92, 230000000
            ), (
                ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_CASH_ENTRY_ID}, 1780358400, 1780358400, 'DEBIT',
                100, NULL, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_TRANSACTION_ID},
                ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ADJUSTMENT_AMOUNT}, 'PRIMARY', 'USER', 1, NULL, 2, 0.025, 6250000
            );

            INSERT INTO debt_events (
                id, created_at, updated_at, debt_account_id, transaction_id, transaction_entry_id, direction, source,
                amount, base_instrument_id, base_exchange_rate, base_amount, operated_at
            )
            VALUES
                (${DebtMigrationIdempotencyAssertions.FRESH_OPEN_EVENT_ID}, 1781049600, 1781049600, ${DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID}, NULL, NULL, 'OPEN', 'MANUAL', 2000000000, 2, 0.92, 1840000000, 1781049600),
                (${DebtMigrationIdempotencyAssertions.FRESH_CLOSE_EVENT_ID}, 1781049600, 1781049600, ${DebtMigrationIdempotencyAssertions.FRESH_ACCOUNT_ID}, NULL, NULL, 'CLOSE', 'MANUAL', 250000000, 2, 0.92, 230000000, 1781049600),
                (${DebtMigrationIdempotencyAssertions.LOOKALIKE_OPEN_EVENT_ID}, 1781136000, 1781136000, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, NULL, NULL, 'OPEN', 'MANUAL', 3000000000, 2, 0.92, 2760000000, 1781136000),
                (${DebtMigrationIdempotencyAssertions.LOOKALIKE_CLOSE_EVENT_ID}, 1781136000, 1781136000, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, NULL, NULL, 'CLOSE', 'MANUAL', 2700000000, 2, 0.92, 2484000000, 1781136000),
                (${DebtMigrationIdempotencyAssertions.LOOKALIKE_SETTLEMENT_EVENT_ID}, 1781136000, 1781136000, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_ACCOUNT_ID}, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ID}, ${DebtMigrationIdempotencyAssertions.LOOKALIKE_TRANSACTION_ENTRY_ID}, 'OPEN', 'MIGRATION', 300000000, 2, 0.92, 276000000, 1781136000),
                (${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_OPEN_EVENT_ID}, 1780358400, 1780358400, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID}, NULL, NULL, 'OPEN', 'MANUAL', 2000000000, 2, 0.92, 1840000000, 1780358400),
                (${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_CLOSE_EVENT_ID}, 1780358400, 1780358400, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID}, NULL, NULL, 'CLOSE', 'MANUAL', 1750000000, 2, 0.92, 1610000000, 1780358400),
                (${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_SETTLEMENT_EVENT_ID}, 1780358400, 1780358400, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_ACCOUNT_ID}, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_TRANSACTION_ID}, ${DebtMigrationIdempotencyAssertions.MULTI_ENTRY_DEBT_ENTRY_ID}, 'OPEN', 'MIGRATION', 250000000, 2, 0.92, 230000000, 1780358400);
        `);
    }
}
