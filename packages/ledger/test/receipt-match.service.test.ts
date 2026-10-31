import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountRepository,
    AccountTypeEnum,
    convertToMicroUnits,
    CurrencyEnum,
    Db,
    TransactionReceiptRepository,
    TransactionRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { ReceiptMatchResultKindEnum } from '../src/receipt/enum/receipt-match-result-kind.enum';
import { ReceiptMatchService } from '../src/receipt/service/receipt-match.service';

import { seed, TestLayer } from './ledger-test-layer';

import type { ReceiptMatchInputInterface } from '../src/receipt/interface/receipt-match-input.interface';

const OCCURRED_AT = new Date(2026, 9, 27, 7, 52, 0);
const OPERATED_AT = new Date(2026, 9, 27, 9, 0, 0);
const TOTAL = convertToMicroUnits(62.1);
const SMALL_AMOUNT = convertToMicroUnits(5);
const EUR_INSTRUMENT_ID = 2;
const CARD_EXTERNAL_ID = 'receipt-card:4242';
const BANK_TITLE = 'CARD PAYMENT IHR LABOR';

const buildReceipt = (overrides: Partial<ReceiptMatchInputInterface> = {}): ReceiptMatchInputInterface => ({
    total: TOTAL,
    currency: CurrencyEnum.USD,
    occurredAt: OCCURRED_AT,
    cardLast4: null,
    receiptNumber: 'K2310000301/26-010863',
    merchantVatId: 'ATU71427716',
    merchantLegalName: 'IHR LABOR GesbR',
    merchantCandidates: ['IHR LABOR'],
    fingerprint: 'ATU71427716|K2310000301/26-010863|62100000|2026-10-27',
    title: 'Ihr Labor',
    description: 'Blood test',
    categoryId: null,
    ...overrides
});

const propose = (input: ReceiptMatchInputInterface) => Effect.flatMap(ReceiptMatchService, service => service.propose(input));

const attach = (transactionId: number, input: ReceiptMatchInputInterface) =>
    Effect.flatMap(ReceiptMatchService, service => service.attach(transactionId, input));

const seedAccount = (title: string, isActive = true, type = AccountTypeEnum.BANK) =>
    Effect.flatMap(seed, testSeedService => testSeedService.account({ title, isActive, type }));

const seedExpense = (accountId: number, title = BANK_TITLE, amount = TOTAL, operatedAt = OPERATED_AT) =>
    Effect.flatMap(seed, testSeedService => testSeedService.manualExpense({ accountId, amount, operatedAt, title }));

const findReceiptTransactionId = (fingerprint = buildReceipt().fingerprint) =>
    Effect.map(
        Effect.flatMap(TransactionReceiptRepository, repository => repository.findByFingerprint(fingerprint)),
        receipt => receipt?.transactionId
    );

const linkCard = (accountId: number) =>
    Effect.flatMap(AccountRepository, repository => repository.addExternalIdAlias(CARD_EXTERNAL_ID, accountId));

const findCardAccountIds = Effect.map(
    Effect.flatMap(AccountRepository, repository => repository.findExternalIdAliases([CARD_EXTERNAL_ID])),
    aliases => aliases.map(alias => alias.account.id)
);

describe('ReceiptMatchService', () => {
    it.effect('proposes the existing transaction for a duplicate fingerprint without writing', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const transaction = yield* seedExpense(account.id);

            yield* (yield* TransactionReceiptRepository).insert({ ...buildReceipt(), transactionId: transaction.id });

            expect(yield* propose(buildReceipt())).toEqual({
                kind: ReceiptMatchResultKindEnum.DUPLICATE,
                transactionId: transaction.id,
                accountId: null
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('proposes a fresh scan of a receipt whose transaction was soft-deleted', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const transaction = yield* seedExpense(account.id, BANK_TITLE, TOTAL);
            yield* seedExpense(account.id, BANK_TITLE, SMALL_AMOUNT);

            yield* attach(transaction.id, buildReceipt());
            yield* (yield* TransactionRepository).archiveByIds([transaction.id]);

            expect(yield* propose(buildReceipt())).toEqual({
                kind: ReceiptMatchResultKindEnum.NEW,
                transactionId: null,
                accountId: account.id
            });
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('proposes the matching transaction without touching it', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const transaction = yield* seedExpense(account.id);

            expect(yield* propose(buildReceipt({ cardLast4: '4242' }))).toEqual({
                kind: ReceiptMatchResultKindEnum.MATCHED,
                transactionId: transaction.id,
                accountId: null
            });
            expect(yield* findReceiptTransactionId()).toBeUndefined();
            expect(yield* findCardAccountIds).toEqual([]);
            expect(isDefined(yield* (yield* TransactionRepository).getByIdWithEntries(transaction.id))).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('picks the card account among tied candidates', () =>
        Effect.gen(function* () {
            const firstAccount = yield* seedAccount('First');
            const cardAccount = yield* seedAccount('Card');
            const first = yield* seedExpense(firstAccount.id);
            const cardTransaction = yield* seedExpense(cardAccount.id);

            expect((yield* propose(buildReceipt())).transactionId).toBe(first.id);

            yield* linkCard(cardAccount.id);

            expect((yield* propose(buildReceipt({ cardLast4: '4242' }))).transactionId).toBe(cardTransaction.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('matches a foreign-currency receipt through the operation amount', () =>
        Effect.gen(function* () {
            const euroAccount = yield* Effect.flatMap(seed, testSeedService =>
                testSeedService.account({ instrumentId: EUR_INSTRUMENT_ID })
            );
            const transaction = yield* seedExpense(euroAccount.id, 'IHR LABOR', convertToMicroUnits(57.4));

            yield* (yield* Db).$client.unsafe(
                `UPDATE transaction_entries SET operation_instrument_id = 1, operation_amount = ${TOTAL} WHERE transaction_id = ${transaction.id}`
            );

            expect((yield* propose(buildReceipt())).transactionId).toBe(transaction.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('proposes the active card account, else the most recent account in the receipt currency', () =>
        Effect.gen(function* () {
            const recentAccount = yield* seedAccount('Recent');
            const archivedCardAccount = yield* seedAccount('Archived card', false);
            yield* seedExpense(recentAccount.id, BANK_TITLE, SMALL_AMOUNT, OCCURRED_AT);
            yield* seedExpense(archivedCardAccount.id, BANK_TITLE, SMALL_AMOUNT);
            yield* linkCard(archivedCardAccount.id);

            const fallback = yield* propose(buildReceipt({ cardLast4: '4242', total: SMALL_AMOUNT * 3 }));
            const cardAccount = yield* seedAccount('Card');
            yield* (yield* AccountRepository).addExternalIdAlias('receipt-card:1111', cardAccount.id);
            const created = yield* propose(buildReceipt({ cardLast4: '1111', total: convertToMicroUnits(12.5) }));

            expect(fallback).toEqual({ kind: ReceiptMatchResultKindEnum.NEW, transactionId: null, accountId: recentAccount.id });
            expect(created).toEqual({ kind: ReceiptMatchResultKindEnum.NEW, transactionId: null, accountId: cardAccount.id });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches the receipt and learns the card on a non-cash account, once', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const transaction = yield* seedExpense(account.id);

            yield* attach(transaction.id, buildReceipt({ cardLast4: '4242' }));
            yield* attach(transaction.id, buildReceipt({ cardLast4: '4242' }));

            expect(yield* findReceiptTransactionId()).toBe(transaction.id);
            expect(yield* findCardAccountIds).toEqual([account.id]);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches the receipt without learning the card onto a cash account', () =>
        Effect.gen(function* () {
            const cashAccount = yield* seedAccount('Cash', true, AccountTypeEnum.CASH);
            const transaction = yield* seedExpense(cashAccount.id);

            yield* attach(transaction.id, buildReceipt({ cardLast4: '4242' }));

            expect(yield* findReceiptTransactionId()).toBe(transaction.id);
            expect(yield* findCardAccountIds).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
