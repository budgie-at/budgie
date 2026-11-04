import { TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    enableBankingDaysAgo,
    enableBankingStub,
    fetchEnableBankingTransactions,
    fetchSortedEnableBankingExternalIds,
    makeEnableBankingSyncStale,
    seedEnableBankingAccount,
    testDb,
    TestLayer
} from '../../harness';

import type { JsonBodyType } from 'msw';

const HASH = 'hash-rows';
const UID = 'uid-rows';
const SESSION = 'session-rows';

const seedWithRows = (rows: JsonBodyType[]) =>
    Effect.gen(function* () {
        const seeded = yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION) });
        enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
        enableBankingStub.balances(UID);
        enableBankingStub.transactions(UID, () => ({ transactions: rows }));

        return seeded;
    });

const syncAgain = (syncId: number) =>
    Effect.gen(function* () {
        const service = yield* EnableBankingSyncService;
        yield* makeEnableBankingSyncStale(syncId);
        yield* service.sync();
    });

const CARD_TEXT = 'POS 12,50 AT K1 03.11.2026 SYNTHETIC CAFE';

const cardRow = (overrides: Record<string, JsonBodyType> = {}) =>
    buildEnableBankingTransaction({ creditor: null, booking_date: '2026-11-03', remittance_information: [CARD_TEXT], ...overrides });

const syncOnce = Effect.gen(function* () {
    const service = yield* EnableBankingSyncService;
    yield* service.sync();

    return yield* fetchEnableBankingTransactions();
});

describe('enable-banking/booked-rows', () => {
    it.effect('never stores a non-BOOK row', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedWithRows([
                buildEnableBankingTransaction({ entry_reference: 'booked' }),
                buildEnableBankingTransaction({ entry_reference: 'pending', status: 'PDNG' }),
                buildEnableBankingTransaction({ entry_reference: 'hold', status: 'HOLD' })
            ]);

            yield* service.sync();

            expect(yield* fetchSortedEnableBankingExternalIds()).toEqual([`${HASH}:booked`]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps identical same-day purchases and stays duplicate-safe on re-fetch', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const purchase = buildEnableBankingTransaction({ entry_reference: null });
            const { sync } = yield* seedWithRows([purchase, purchase]);

            yield* service.sync();
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(2);

            yield* syncAgain(sync.id);
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('suffixes a repeated entry_reference within one booking date', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedWithRows([
                buildEnableBankingTransaction({ entry_reference: 'shared', transaction_amount: { amount: '1.00', currency: 'EUR' } }),
                buildEnableBankingTransaction({ entry_reference: 'shared', transaction_amount: { amount: '2.00', currency: 'EUR' } })
            ]);

            yield* service.sync();
            expect(yield* fetchSortedEnableBankingExternalIds()).toEqual([`${HASH}:shared`, `${HASH}:shared:1`]);

            yield* syncAgain(sync.id);
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fails the batch when a bank repeats entry_reference across dates', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedWithRows([
                buildEnableBankingTransaction({ entry_reference: 'shared', booking_date: enableBankingDaysAgo(1) }),
                buildEnableBankingTransaction({ entry_reference: 'shared', booking_date: enableBankingDaysAgo(2) })
            ]);

            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fails the batch on a BOOK row with no date instead of storing it undated', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedWithRows([buildEnableBankingTransaction({ booking_date: null, value_date: null })]);

            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to value_date at noon UTC', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const valueDate = enableBankingDaysAgo(2);
            yield* seedWithRows([buildEnableBankingTransaction({ booking_date: null, value_date: valueDate })]);

            yield* service.sync();

            const [transaction] = yield* fetchEnableBankingTransactions();
            expect(transaction.operatedAt).toEqual(new Date(`${valueDate}T12:00:00.000Z`));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('parses decimal amounts exactly and applies the indicator', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedWithRows([
                buildEnableBankingTransaction({
                    entry_reference: 'income',
                    credit_debit_indicator: 'CRDT',
                    debtor: { name: 'Synthetic Payer' },
                    transaction_amount: { amount: '1234567.89', currency: 'EUR' }
                })
            ]);

            yield* service.sync();

            const [transaction] = yield* fetchEnableBankingTransactions();
            expect(transaction).toMatchObject({ title: 'Synthetic Payer', type: 'INCOME' });
            const [entry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, `${HASH}:income`));
            expect(entry.amount).toBe(1_234_567_890_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fails the batch when a row is not in the account currency', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedWithRows([buildEnableBankingTransaction({ transaction_amount: { amount: '5.00', currency: 'USD' } })]);

            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps user edits inside the lookback', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedWithRows([buildEnableBankingTransaction()]);

            yield* service.sync();
            const [transaction] = yield* fetchEnableBankingTransactions();
            yield* testDb
                .update(TransactionEntityTable)
                .set({ title: 'Edited by user' })
                .where(eq(TransactionEntityTable.id, transaction.id));

            yield* syncAgain(sync.id);

            const [refetched] = yield* fetchEnableBankingTransactions();
            expect(refetched.title).toBe('Edited by user');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not recreate a row deleted through TransactionService.deleteById', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const transactionService = yield* TransactionService;
            const { sync } = yield* seedWithRows([buildEnableBankingTransaction()]);

            yield* service.sync();
            const [transaction] = yield* fetchEnableBankingTransactions();
            yield* transactionService.deleteById(transaction.id);

            yield* syncAgain(sync.id);

            const transactions = yield* fetchEnableBankingTransactions();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].deletedAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('titles a card row by its merchant, keeps the raw text as the comment and the reference as the identity', () =>
        Effect.gen(function* () {
            yield* seedWithRows([cardRow({ entry_reference: 'card-reference' })]);

            const [transaction] = yield* syncOnce;

            expect(transaction).toMatchObject({ title: 'SYNTHETIC CAFE', comment: CARD_TEXT, externalId: `${HASH}:card-reference` });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the raw title when the text does not parse or the merchant is empty', () =>
        Effect.gen(function* () {
            yield* seedWithRows([
                cardRow({ entry_reference: 'unparsed', remittance_information: ['POS 12,50 SYNTHETIC CAFE'] }),
                cardRow({ entry_reference: 'no-merchant', remittance_information: ['POS 12,50 AT K1 03.11.2026   '] }),
                cardRow({ entry_reference: 'transfer', remittance_information: ['Synthetic rent'] })
            ]);

            const titles = (yield* syncOnce).map(transaction => [transaction.externalId, transaction.title]);

            expect(titles).toEqual(
                expect.arrayContaining([
                    [`${HASH}:unparsed`, 'POS 12,50 SYNTHETIC CAFE'],
                    [`${HASH}:no-merchant`, 'POS 12,50 AT K1 03.11.2026'],
                    [`${HASH}:transfer`, 'Synthetic rent']
                ])
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('prefers the structured counterparty name over any remittance text', () =>
        Effect.gen(function* () {
            yield* seedWithRows([cardRow({ creditor: { name: 'Synthetic Merchant Ltd' } })]);

            const [transaction] = yield* syncOnce;

            expect(transaction).toMatchObject({ title: 'Synthetic Merchant Ltd', comment: CARD_TEXT });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'hashes the raw text for rows without a reference, so equal cleaned titles never collapse and re-fetches never duplicate',
        () =>
            Effect.gen(function* () {
                const service = yield* EnableBankingSyncService;
                const { sync } = yield* seedWithRows([
                    cardRow({ entry_reference: null }),
                    cardRow({ entry_reference: null, remittance_information: ['POS 12,50 AT K2 03.11.2026 SYNTHETIC CAFE'] })
                ]);

                const first = yield* syncOnce;
                const firstIds = yield* fetchSortedEnableBankingExternalIds();
                yield* makeEnableBankingSyncStale(sync.id);
                yield* service.sync();

                expect(first.map(transaction => transaction.title)).toEqual(['SYNTHETIC CAFE', 'SYNTHETIC CAFE']);
                expect(firstIds).toEqual([`${HASH}:3dab0f8c3bcaa28f48386edbe47b28f1`, `${HASH}:94ee593acb11c74d044ae5191a0b62b7`]);
                expect(yield* fetchSortedEnableBankingExternalIds()).toEqual(firstIds);
            }).pipe(Effect.provide(TestLayer))
    );
});
