import { BORROWING_CATEGORY_ID, CategorySourceEnum, LENDING_CATEGORY_ID } from '@budgie/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { applyMigration } from '../../harness/db/apply-migration';
import { testDb } from '../../harness/scenario/setup';

import { DebtV2LegacyShapeFixture } from './debt-v2-legacy-shape.fixture';

const MIGRATION_FILE_NAME = '0060_debt_v2_money_legs.sql';
const FIXTURE_ACCOUNT_IDS = [
    DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID,
    DebtV2LegacyShapeFixture.EUR_FUNDING_ACCOUNT_ID,
    DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID,
    DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID,
    DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID,
    DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID
];

interface TransactionRowInterface {
    readonly id: number;
    readonly type: string;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly deletedAt: number | null;
}

interface EntryRowInterface {
    readonly id: number;
    readonly accountId: number;
    readonly kind: string;
    readonly categoryId: number | null;
    readonly categorySource: string;
    readonly amount: number;
    readonly deletedAt: number | null;
}

interface EventRowInterface {
    readonly id: number;
    readonly transactionEntryId: number | null;
    readonly direction: string;
    readonly source: string;
    readonly amount: number;
}

interface BalanceRowInterface {
    readonly accountId: number;
    readonly amount: number;
    readonly updatedAt: number;
}

const fetchTransactions = (): Promise<TransactionRowInterface[]> =>
    testDb.$client.getAllAsync<TransactionRowInterface>(
        'SELECT id, type, from_account_id AS fromAccountId, to_account_id AS toAccountId, deleted_at AS deletedAt FROM transactions WHERE id >= 951000 AND id < 952000 ORDER BY id'
    );

const fetchEntries = (): Promise<EntryRowInterface[]> =>
    testDb.$client.getAllAsync<EntryRowInterface>(
        'SELECT id, account_id AS accountId, kind, category_id AS categoryId, category_source AS categorySource, amount, deleted_at AS deletedAt FROM transaction_entries WHERE id >= 952000 AND id < 953000 ORDER BY id'
    );

const fetchEvents = (): Promise<EventRowInterface[]> =>
    testDb.$client.getAllAsync<EventRowInterface>(
        'SELECT id, transaction_entry_id AS transactionEntryId, direction, source, amount FROM debt_events WHERE id >= 953000 AND id < 954000 AND deleted_at IS NULL ORDER BY id'
    );

const fetchBalances = (): Promise<BalanceRowInterface[]> =>
    testDb.$client.getAllAsync<BalanceRowInterface>(
        'SELECT account_id AS accountId, amount, updated_at AS updatedAt FROM account_balances WHERE id >= 954000 AND id < 955000 AND deleted_at IS NULL ORDER BY account_id'
    );

const fetchSnapshot = async () => ({
    balances: await fetchBalances(),
    entries: await fetchEntries(),
    events: await fetchEvents(),
    transactions: await fetchTransactions()
});

const findTransaction = (rows: TransactionRowInterface[], id: number) => rows.find(row => row.id === id);
const findEntry = (rows: EntryRowInterface[], id: number) => rows.find(row => row.id === id);
const findEvent = (rows: EventRowInterface[], id: number) => rows.find(row => row.id === id);
const findBalance = (rows: BalanceRowInterface[], accountId: number) => rows.find(row => row.accountId === accountId);

describe('debt/debt-v2-money-legs-migration', () => {
    let firstRun: Awaited<ReturnType<typeof fetchSnapshot>>;
    let secondRun: Awaited<ReturnType<typeof fetchSnapshot>>;

    beforeEach(async () => {
        await new DebtV2LegacyShapeFixture().seed();
        await applyMigration(MIGRATION_FILE_NAME);
        firstRun = await fetchSnapshot();
        await applyMigration(MIGRATION_FILE_NAME);
        secondRun = await fetchSnapshot();
    });

    it('leaves no debt-typed transaction, no debt-account entry and no mirror leg alive', async () => {
        expect(
            await testDb.$client.getAllAsync<{ id: number }>("SELECT id FROM transactions WHERE type = 'DEBT' AND deleted_at IS NULL")
        ).toHaveLength(0);
        expect(
            await testDb.$client.getAllAsync<{ id: number }>(
                `SELECT transaction_entries.id FROM transaction_entries
                 INNER JOIN accounts ON accounts.id = transaction_entries.account_id AND accounts.type = 'DEBT'
                 WHERE transaction_entries.deleted_at IS NULL AND accounts.id IN (${FIXTURE_ACCOUNT_IDS.join(',')})`
            )
        ).toHaveLength(0);
        expect(
            await testDb.$client.getAllAsync<{ id: number }>(
                "SELECT id FROM transaction_entries WHERE kind = 'DEBT_SETTLEMENT' AND deleted_at IS NULL"
            )
        ).toHaveLength(0);
    });

    it('retypes the lent opening transfer into a funding-account expense carrying Lending', () => {
        expect(findTransaction(firstRun.transactions, DebtV2LegacyShapeFixture.LENT_OPENING_TRANSACTION_ID)).toMatchObject({
            fromAccountId: DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID,
            toAccountId: null,
            type: 'EXPENSE'
        });
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.LENT_OPENING_FUNDING_ENTRY_ID)).toMatchObject({
            categoryId: LENDING_CATEGORY_ID,
            categorySource: CategorySourceEnum.DEBT_SETTLEMENT,
            deletedAt: null
        });
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.LENT_OPENING_DEBT_ENTRY_ID)?.deletedAt).not.toBeNull();
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.LENT_OPENING_EVENT_ID)).toMatchObject({
            amount: DebtV2LegacyShapeFixture.LENT_PRINCIPAL_AMOUNT,
            source: 'OPENING',
            transactionEntryId: DebtV2LegacyShapeFixture.LENT_OPENING_FUNDING_ENTRY_ID
        });
    });

    it('retypes the borrowed opening transfer into a funding-account income carrying Borrowing', () => {
        expect(findTransaction(firstRun.transactions, DebtV2LegacyShapeFixture.BORROW_OPENING_TRANSACTION_ID)).toMatchObject({
            fromAccountId: null,
            toAccountId: DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID,
            type: 'INCOME'
        });
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.BORROW_OPENING_FUNDING_ENTRY_ID)).toMatchObject({
            categoryId: BORROWING_CATEGORY_ID,
            categorySource: CategorySourceEnum.DEBT_SETTLEMENT
        });
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.BORROW_OPENING_EVENT_ID)).toMatchObject({
            source: 'OPENING',
            transactionEntryId: DebtV2LegacyShapeFixture.BORROW_OPENING_FUNDING_ENTRY_ID
        });
    });

    it('keeps repayment transfers as closing events and never rewrites their amounts', () => {
        expect(findTransaction(firstRun.transactions, DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_TRANSACTION_ID)?.type).toBe(
            'INCOME'
        );
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.SAME_INSTRUMENT_EVENT_ID)).toMatchObject({
            amount: DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REAL_EVENT_AMOUNT,
            direction: 'CLOSE',
            transactionEntryId: DebtV2LegacyShapeFixture.SAME_INSTRUMENT_FUNDING_ENTRY_ID
        });
        expect(findTransaction(firstRun.transactions, DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_REPAYMENT_TRANSACTION_ID)).toMatchObject({
            fromAccountId: DebtV2LegacyShapeFixture.EUR_FUNDING_ACCOUNT_ID,
            type: 'EXPENSE'
        });
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_FUNDING_ENTRY_ID)).toMatchObject({
            amount: DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_FUNDING_AMOUNT,
            categoryId: BORROWING_CATEGORY_ID
        });
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_EVENT_ID)).toMatchObject({
            amount: DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_DEBT_AMOUNT,
            transactionEntryId: DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_FUNDING_ENTRY_ID
        });
    });

    it('drops mirror legs, recategorises plumbing categories and preserves user-chosen ones', () => {
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.PLUMBING_MIRROR_FUNDING_ENTRY_ID)).toMatchObject({
            categoryId: LENDING_CATEGORY_ID,
            categorySource: CategorySourceEnum.DEBT_SETTLEMENT
        });
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.PLUMBING_MIRROR_DEBT_ENTRY_ID)?.deletedAt).not.toBeNull();
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.PLUMBING_MIRROR_EVENT_ID)?.transactionEntryId).toBe(
            DebtV2LegacyShapeFixture.PLUMBING_MIRROR_FUNDING_ENTRY_ID
        );
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.USER_CATEGORY_FUNDING_ENTRY_ID)).toMatchObject({
            categoryId: DebtV2LegacyShapeFixture.USER_CATEGORY_ID,
            categorySource: CategorySourceEnum.USER
        });
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_EVENT_ID)?.transactionEntryId).toBe(
            DebtV2LegacyShapeFixture.USER_CATEGORY_FUNDING_ENTRY_ID
        );
    });

    it('removes the adjustment parked on a debt account', () => {
        expect(findTransaction(firstRun.transactions, DebtV2LegacyShapeFixture.PARKED_ADJUSTMENT_TRANSACTION_ID)?.deletedAt).not.toBeNull();
        expect(findEntry(firstRun.entries, DebtV2LegacyShapeFixture.PARKED_ADJUSTMENT_ENTRY_ID)?.deletedAt).not.toBeNull();
    });

    it('rebuilds debt ledger balances from events and leaves funding balances alone', () => {
        const lentBalanceAmount = findBalance(firstRun.balances, DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID)?.amount;

        expect(lentBalanceAmount).toBe(800_000_000);
        expect(Number.isInteger(lentBalanceAmount)).toBe(true);
        expect(findBalance(firstRun.balances, DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID)?.amount).toBe(-380_000_000);
        expect(findBalance(firstRun.balances, DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID)?.amount).toBe(1_600_000_000);
        expect(findBalance(firstRun.balances, DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID)?.amount).toBe(
            DebtV2LegacyShapeFixture.USD_FUNDING_BALANCE_AMOUNT
        );
    });

    it('leaves a manual-only debt bit-identical', () => {
        expect(findBalance(firstRun.balances, DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID)).toEqual({
            accountId: DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID,
            amount: DebtV2LegacyShapeFixture.MANUAL_PRINCIPAL_AMOUNT - DebtV2LegacyShapeFixture.MANUAL_REPAID_AMOUNT,
            updatedAt: 1_780_358_400
        });
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.MANUAL_OPENING_EVENT_ID)).toMatchObject({
            source: 'MANUAL',
            transactionEntryId: null
        });
        expect(findEvent(firstRun.events, DebtV2LegacyShapeFixture.MANUAL_CLOSING_EVENT_ID)).toMatchObject({
            source: 'MANUAL',
            transactionEntryId: null
        });
    });

    it('is a no-op on a second run', () => {
        expect(secondRun).toEqual(firstRun);
    });
});
