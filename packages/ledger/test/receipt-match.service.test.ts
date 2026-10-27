import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
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

import { isDefined } from '@rnw-community/shared';

import { ReceiptMatchResultKindEnum } from '../src/receipt/enum/receipt-match-result-kind.enum';
import { ReceiptMatchService } from '../src/receipt/service/receipt-match.service';

import { seed, TestLayer } from './ledger-test-layer';

import type { ReceiptMatchInputInterface } from '../src/receipt/interface/receipt-match-input.interface';

const OCCURRED_AT = new Date(2026, 9, 27, 7, 52, 0);
const OPERATED_AT = new Date(2026, 9, 27, 9, 0, 0);
const TOTAL = convertToMicroUnits(62.1);
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

const match = (input: ReceiptMatchInputInterface) =>
    Effect.flatMap(ReceiptMatchService, service => service.match(input, () => Effect.void));

const seedExpense = Effect.fnUntraced(function* (accountId: number, title: string) {
    const testSeedService = yield* seed;

    return yield* testSeedService.manualExpense({ accountId, amount: TOTAL, operatedAt: OPERATED_AT, title });
});

const fetchTransaction = Effect.fnUntraced(function* (transactionId: number) {
    const transactionRepository = yield* TransactionRepository;
    const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

    if (!isDefined(transaction)) {
        return yield* Effect.die(new Error(`Transaction ${transactionId} not found`));
    }

    return transaction;
});

const linkCard = (accountId: number) =>
    Effect.flatMap(AccountRepository, repository => repository.addExternalIdAlias(CARD_EXTERNAL_ID, accountId));

describe('ReceiptMatchService', () => {
    it.effect('returns the existing transaction for a duplicate fingerprint and writes nothing', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account();
            const transaction = yield* seedExpense(account.id, BANK_TITLE);
            const receipt = buildReceipt();
            const transactionReceiptRepository = yield* TransactionReceiptRepository;

            yield* transactionReceiptRepository.insert({ ...receipt, transactionId: transaction.id });

            expect(yield* match(receipt)).toEqual({ kind: ReceiptMatchResultKindEnum.DUPLICATE, transactionId: transaction.id });
            expect((yield* fetchTransaction(transaction.id)).title).toBe(BANK_TITLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('scans again a receipt whose transaction was soft-deleted', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account();
            yield* testSeedService.manualExpense({ accountId: account.id, amount: convertToMicroUnits(5), operatedAt: OPERATED_AT });
            const first = yield* match(buildReceipt());
            const transactionRepository = yield* TransactionRepository;

            yield* transactionRepository.archiveByIds([first.transactionId]);

            const rescan = yield* match(buildReceipt());

            expect(first.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect(rescan.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect(rescan.transactionId).not.toBe(first.transactionId);
            expect((yield* (yield* TransactionReceiptRepository).findByFingerprint(buildReceipt().fingerprint))?.transactionId).toBe(
                rescan.transactionId
            );
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('enriches an exact match without touching its money', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account();
            const category = yield* testSeedService.category('Health');
            const transaction = yield* seedExpense(account.id, BANK_TITLE);

            const result = yield* match(buildReceipt({ cardLast4: '4242', categoryId: category.id }));
            const matched = yield* fetchTransaction(transaction.id);
            const accountRepository = yield* AccountRepository;
            const [alias] = yield* accountRepository.findExternalIdAliases([CARD_EXTERNAL_ID]);

            expect(result).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: transaction.id });
            expect(matched.title).toBe('Ihr Labor');
            expect(matched.comment).toBe('Blood test');
            expect(matched.operatedAt).toEqual(OPERATED_AT);
            expect(matched.entries).toMatchObject([
                { accountId: account.id, amount: TOTAL, categoryId: category.id, categorySource: CategorySourceEnum.AI }
            ]);
            expect(alias.account.id).toBe(account.id);
            expect((yield* (yield* TransactionReceiptRepository).findByFingerprint(buildReceipt().fingerprint))?.transactionId).toBe(
                transaction.id
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a title the user edited', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account();
            const transaction = yield* seedExpense(account.id, 'Lab visit');
            const database = yield* Db;

            yield* database.$client.unsafe(`UPDATE transactions SET updated_by = 'user' WHERE id = ${transaction.id}`);

            expect((yield* match(buildReceipt())).kind).toBe(ReceiptMatchResultKindEnum.MATCHED);
            expect((yield* fetchTransaction(transaction.id)).title).toBe('Lab visit');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('breaks a tie by the account learned for the card', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const firstAccount = yield* testSeedService.account({ title: 'First' });
            const cardAccount = yield* testSeedService.account({ title: 'Card' });
            yield* seedExpense(firstAccount.id, BANK_TITLE);
            const cardTransaction = yield* seedExpense(cardAccount.id, BANK_TITLE);

            yield* linkCard(cardAccount.id);

            expect(yield* match(buildReceipt({ cardLast4: '4242' }))).toEqual({
                kind: ReceiptMatchResultKindEnum.MATCHED,
                transactionId: cardTransaction.id
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('matches one of the tied candidates instead of double-counting the expense', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const firstAccount = yield* testSeedService.account({ title: 'First' });
            const secondAccount = yield* testSeedService.account({ title: 'Second' });
            const first = yield* seedExpense(firstAccount.id, BANK_TITLE);
            yield* seedExpense(secondAccount.id, BANK_TITLE);

            expect(yield* match(buildReceipt())).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: first.id });
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the account learned for the card when the receipt matches another account by amount', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const cardAccount = yield* testSeedService.account({ title: 'Card' });
            const otherAccount = yield* testSeedService.account({ title: 'Other' });
            const otherTransaction = yield* seedExpense(otherAccount.id, BANK_TITLE);
            const accountRepository = yield* AccountRepository;

            yield* linkCard(cardAccount.id);

            expect(yield* match(buildReceipt({ cardLast4: '4242' }))).toEqual({
                kind: ReceiptMatchResultKindEnum.MATCHED,
                transactionId: otherTransaction.id
            });
            expect((yield* accountRepository.findExternalIdAliases([CARD_EXTERNAL_ID])).map(alias => alias.account.id)).toEqual([
                cardAccount.id
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('matches a foreign-currency receipt through the operation amount', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const euroAccount = yield* testSeedService.account({ instrumentId: EUR_INSTRUMENT_ID });
            const transaction = yield* testSeedService.manualExpense({
                accountId: euroAccount.id,
                amount: convertToMicroUnits(57.4),
                operatedAt: OPERATED_AT,
                title: 'IHR LABOR'
            });
            const database = yield* Db;

            yield* database.$client.unsafe(
                `UPDATE transaction_entries SET operation_instrument_id = 1, operation_amount = ${TOTAL} WHERE transaction_id = ${transaction.id}`
            );

            expect(yield* match(buildReceipt())).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: transaction.id });
            expect((yield* fetchTransaction(transaction.id)).entries[0].amount).toBe(convertToMicroUnits(57.4));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates the expense on the account learned for the card with correct balances', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const recentAccount = yield* testSeedService.account({ title: 'Recent' });
            const cardAccount = yield* testSeedService.account({ title: 'Card' });
            const category = yield* testSeedService.category('Health');
            yield* testSeedService.manualExpense({ accountId: recentAccount.id, amount: convertToMicroUnits(5), operatedAt: OPERATED_AT });
            yield* linkCard(cardAccount.id);

            const result = yield* match(buildReceipt({ cardLast4: '4242', categoryId: category.id, total: convertToMicroUnits(12.5) }));
            const created = yield* fetchTransaction(result.transactionId);
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const [balance] = yield* accountBalanceRepository.getByAccountIds([cardAccount.id]);

            expect(result.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect(created).toMatchObject({
                title: 'Ihr Labor',
                comment: 'Blood test',
                operatedAt: OCCURRED_AT,
                externalSource: ExternalSourceEnum.RECEIPT,
                externalId: buildReceipt().fingerprint
            });
            expect(created.entries).toMatchObject([
                {
                    accountId: cardAccount.id,
                    amount: convertToMicroUnits(12.5),
                    categoryId: category.id,
                    categorySource: CategorySourceEnum.AI
                }
            ]);
            expect(balance.amount).toBe(-convertToMicroUnits(12.5));
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the most recently used expense account in the receipt currency', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const recentAccount = yield* testSeedService.account({ title: 'Recent' });
            yield* testSeedService.manualExpense({ accountId: recentAccount.id, amount: convertToMicroUnits(5), operatedAt: OPERATED_AT });

            const result = yield* match(buildReceipt());

            expect(result.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect((yield* fetchTransaction(result.transactionId)).entries[0].accountId).toBe(recentAccount.id);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never creates the expense on an archived account', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const activeAccount = yield* testSeedService.account({ title: 'Active' });
            const archivedCardAccount = yield* testSeedService.account({ title: 'Archived card', isActive: false });
            yield* testSeedService.manualExpense({ accountId: activeAccount.id, amount: convertToMicroUnits(5), operatedAt: OCCURRED_AT });
            yield* testSeedService.manualExpense({
                accountId: archivedCardAccount.id,
                amount: convertToMicroUnits(5),
                operatedAt: OPERATED_AT
            });
            yield* linkCard(archivedCardAccount.id);

            const result = yield* match(buildReceipt({ cardLast4: '4242' }));

            expect(result.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect((yield* fetchTransaction(result.transactionId)).entries[0].accountId).toBe(activeAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
