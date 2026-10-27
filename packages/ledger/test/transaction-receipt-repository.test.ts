import { convertToMicroUnits, Db, TransactionReceiptRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { seed, TestLayer } from './ledger-test-layer';

const OPERATED_AT = new Date(2026, 9, 27, 7, 52, 7);
const FINGERPRINT = 'ATU71427716|K2310000301/26-010863|62100000|2026-10-27';

const seedExpense = Effect.gen(function* () {
    const testSeedService = yield* seed;
    const account = yield* testSeedService.account();

    return yield* testSeedService.manualExpense({ accountId: account.id, amount: convertToMicroUnits(62.1), operatedAt: OPERATED_AT });
});

const receipt = (transactionId: number, fingerprint: string) => ({
    transactionId,
    fingerprint,
    receiptNumber: 'K2310000301/26-010863',
    merchantVatId: 'ATU71427716',
    merchantLegalName: 'IHR LABOR - Ordinationsgemeinschaft für Labordiagnostik und Mikrobiologie GesbR'
});

describe('TransactionReceiptRepository', () => {
    it.effect('finds an inserted receipt by fingerprint', () =>
        Effect.gen(function* () {
            const transactionReceiptRepository = yield* TransactionReceiptRepository;
            const transaction = yield* seedExpense;

            const inserted = yield* transactionReceiptRepository.insert(receipt(transaction.id, FINGERPRINT));

            expect(inserted.transactionId).toBe(transaction.id);
            expect(inserted.scannedAt).toBeInstanceOf(Date);
            expect((yield* transactionReceiptRepository.findByFingerprint(FINGERPRINT))?.transactionId).toBe(transaction.id);
            expect(yield* transactionReceiptRepository.findByFingerprint('missing')).toBeUndefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a second receipt with the same fingerprint', () =>
        Effect.gen(function* () {
            const transactionReceiptRepository = yield* TransactionReceiptRepository;
            const first = yield* seedExpense;
            const second = yield* seedExpense;

            yield* transactionReceiptRepository.insert(receipt(first.id, FINGERPRINT));

            const exit = yield* Effect.exit(transactionReceiptRepository.insert(receipt(second.id, FINGERPRINT)));

            expect(Exit.isFailure(exit)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('deletes the receipt together with its transaction', () =>
        Effect.gen(function* () {
            const transactionReceiptRepository = yield* TransactionReceiptRepository;
            const database = yield* Db;
            const transaction = yield* seedExpense;

            yield* transactionReceiptRepository.insert(receipt(transaction.id, FINGERPRINT));
            yield* database.$client.unsafe(`DELETE FROM transaction_entries WHERE transaction_id = ${transaction.id}`);
            yield* database.$client.unsafe(`DELETE FROM transactions WHERE id = ${transaction.id}`);

            expect(yield* transactionReceiptRepository.findByFingerprint(FINGERPRINT)).toBeUndefined();
        }).pipe(Effect.provide(TestLayer))
    );
});
