import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountRepository,
    CategorySourceEnum,
    convertToMicroUnits,
    CurrencyEnum,
    Db,
    ExternalSourceEnum,
    TransactionReceiptRepository,
    TransactionRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Option from 'effect/Option';

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

const match = (
    input: ReceiptMatchInputInterface,
    applyRules: (transactionId: number) => Effect.Effect<void, never, Db> = () => Effect.void
) => Effect.flatMap(ReceiptMatchService, service => service.match(input, applyRules));

const seedAccount = (title: string, isActive = true) =>
    Effect.flatMap(seed, testSeedService => testSeedService.account({ title, isActive }));

const seedExpense = (accountId: number, title = BANK_TITLE, amount = TOTAL, operatedAt = OPERATED_AT) =>
    Effect.flatMap(seed, testSeedService => testSeedService.manualExpense({ accountId, amount, operatedAt, title }));

const fetchTransaction = Effect.fnUntraced(function* (transactionId: number) {
    const transaction = yield* (yield* TransactionRepository).getByIdWithEntries(transactionId);

    return isDefined(transaction) ? transaction : yield* Effect.die(new Error(`Transaction ${transactionId} not found`));
});

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
    it.effect('returns the existing transaction for a duplicate fingerprint without writing or applying rules', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const transaction = yield* seedExpense(account.id);
            const ruledIds: number[] = [];

            yield* (yield* TransactionReceiptRepository).insert({ ...buildReceipt(), transactionId: transaction.id });

            expect(yield* match(buildReceipt(), id => Effect.sync(() => void ruledIds.push(id)))).toEqual({
                kind: ReceiptMatchResultKindEnum.DUPLICATE,
                transactionId: transaction.id
            });
            expect((yield* fetchTransaction(transaction.id)).title).toBe(BANK_TITLE);
            expect(ruledIds).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('scans again a receipt whose transaction was soft-deleted', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            yield* seedExpense(account.id, BANK_TITLE, SMALL_AMOUNT);
            const first = yield* match(buildReceipt());

            yield* (yield* TransactionRepository).archiveByIds([first.transactionId]);

            const rescan = yield* match(buildReceipt());

            expect([first.kind, rescan.kind]).toEqual([ReceiptMatchResultKindEnum.CREATED, ReceiptMatchResultKindEnum.CREATED]);
            expect(rescan.transactionId).not.toBe(first.transactionId);
            expect(yield* findReceiptTransactionId()).toBe(rescan.transactionId);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('enriches an exact match without touching its money and learns the card account', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const category = yield* Effect.flatMap(seed, testSeedService => testSeedService.category('Health'));
            const transaction = yield* seedExpense(account.id);

            const result = yield* match(buildReceipt({ cardLast4: '4242', categoryId: category.id }));

            expect(result).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: transaction.id });
            expect(yield* fetchTransaction(transaction.id)).toMatchObject({
                title: 'Ihr Labor',
                comment: 'Blood test',
                operatedAt: OPERATED_AT,
                entries: [{ accountId: account.id, amount: TOTAL, categoryId: category.id, categorySource: CategorySourceEnum.AI }]
            });
            expect(yield* findCardAccountIds).toEqual([account.id]);
            expect(yield* findReceiptTransactionId()).toBe(transaction.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a title the user edited and skips rules for it', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            const transaction = yield* seedExpense(account.id, 'Lab visit');
            const ruledIds: number[] = [];

            yield* (yield* Db).$client.unsafe(`UPDATE transactions SET updated_by = 'user' WHERE id = ${transaction.id}`);

            expect((yield* match(buildReceipt(), id => Effect.sync(() => void ruledIds.push(id)))).kind).toBe(
                ReceiptMatchResultKindEnum.MATCHED
            );
            expect((yield* fetchTransaction(transaction.id)).title).toBe('Lab visit');
            expect(ruledIds).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('picks the card account among tied candidates and matches only one of them', () =>
        Effect.gen(function* () {
            const firstAccount = yield* seedAccount('First');
            const cardAccount = yield* seedAccount('Card');
            const first = yield* seedExpense(firstAccount.id);
            const cardTransaction = yield* seedExpense(cardAccount.id);

            expect(yield* match(buildReceipt({ fingerprint: 'no-card' }))).toEqual({
                kind: ReceiptMatchResultKindEnum.MATCHED,
                transactionId: first.id
            });

            yield* linkCard(cardAccount.id);

            expect(yield* match(buildReceipt({ cardLast4: '4242' }))).toEqual({
                kind: ReceiptMatchResultKindEnum.MATCHED,
                transactionId: cardTransaction.id
            });
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the account learned for the card when the receipt matches another account by amount', () =>
        Effect.gen(function* () {
            const cardAccount = yield* seedAccount('Card');
            const otherAccount = yield* seedAccount('Other');
            const otherTransaction = yield* seedExpense(otherAccount.id);

            yield* linkCard(cardAccount.id);

            expect(yield* match(buildReceipt({ cardLast4: '4242' }))).toEqual({
                kind: ReceiptMatchResultKindEnum.MATCHED,
                transactionId: otherTransaction.id
            });
            expect(yield* findCardAccountIds).toEqual([cardAccount.id]);
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

            expect(yield* match(buildReceipt())).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: transaction.id });
            expect((yield* fetchTransaction(transaction.id)).entries[0].amount).toBe(convertToMicroUnits(57.4));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates the expense on the active card account, else the most recent account in the receipt currency', () =>
        Effect.gen(function* () {
            const recentAccount = yield* seedAccount('Recent');
            const archivedCardAccount = yield* seedAccount('Archived card', false);
            yield* seedExpense(recentAccount.id, BANK_TITLE, SMALL_AMOUNT, OCCURRED_AT);
            yield* seedExpense(archivedCardAccount.id, BANK_TITLE, SMALL_AMOUNT);
            yield* linkCard(archivedCardAccount.id);

            const fallback = yield* match(buildReceipt({ cardLast4: '4242', fingerprint: 'archived-card', total: SMALL_AMOUNT * 3 }));
            const cardAccount = yield* seedAccount('Card');
            yield* (yield* AccountRepository).addExternalIdAlias('receipt-card:1111', cardAccount.id);
            const created = yield* match(buildReceipt({ cardLast4: '1111', total: convertToMicroUnits(12.5) }));

            expect((yield* fetchTransaction(fallback.transactionId)).entries[0].accountId).toBe(recentAccount.id);
            expect(created.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect(yield* fetchTransaction(created.transactionId)).toMatchObject({
                title: 'Ihr Labor',
                comment: 'Blood test',
                operatedAt: OCCURRED_AT,
                externalSource: ExternalSourceEnum.RECEIPT,
                externalId: buildReceipt().fingerprint,
                entries: [{ accountId: cardAccount.id, amount: convertToMicroUnits(12.5) }]
            });
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('applies rules after the receipt commits, so a rule failure keeps the expense and its receipt', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount('Main');
            yield* seedExpense(account.id, BANK_TITLE, SMALL_AMOUNT);
            const database = yield* Db;
            const ruleCalls: Array<[number, boolean]> = [];

            const exit = yield* Effect.exit(
                match(buildReceipt(), transactionId =>
                    Effect.flatMap(Effect.serviceOption(database.$client.transactionService), transaction =>
                        Effect.andThen(
                            Effect.sync(() => void ruleCalls.push([transactionId, Option.isSome(transaction)])),
                            Effect.die(new Error('rule failed'))
                        )
                    )
                )
            );
            const receiptTransactionId = yield* findReceiptTransactionId();

            expect(Exit.isFailure(exit)).toBe(true);
            expect(isDefined(receiptTransactionId)).toBe(true);
            expect(ruleCalls).toEqual([[receiptTransactionId, false]]);
            yield* assertStoredBalancesMatchLedger(database);
        }).pipe(Effect.provide(TestLayer))
    );
});
