import {
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    convertFromMicroUnits,
    convertToMicroUnits,
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionReceiptRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { createTransactionInput, ReceiptMatchResultKindEnum, ReceiptMatchService, TransactionService } from '@budgie/ledger';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { expectConsolidationParent, fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const AMOUNT = 62.1;
const RECEIPT_OCCURRED_AT = new Date('2026-10-27T07:52:00Z');
const BANK_OPERATED_AT = new Date('2026-10-28T09:00:00Z');
const FINGERPRINT = 'ATU71427716|K2310000301/26-010863|62100000|2026-10-27';

const buildReceipt = (fingerprint: string, receiptNumber: string) => ({
    total: convertToMicroUnits(AMOUNT),
    currency: CurrencyEnum.USD,
    occurredAt: RECEIPT_OCCURRED_AT,
    cardLast4: '4242',
    receiptNumber,
    merchantVatId: 'ATU71427716',
    merchantLegalName: 'IHR LABOR GesbR',
    merchantCandidates: ['IHR LABOR'],
    fingerprint,
    title: 'Ihr Labor',
    description: null,
    categoryId: null
});

const importBankExpense = (accountId: number, externalId = 'erste-receipt-payment', operatedAt = BANK_OPERATED_AT) =>
    Effect.flatMap(TransactionService, transactionService =>
        transactionService.createInternal({
            ...createTransactionInput({
                type: TransactionTypeEnum.EXPENSE,
                fromAccountId: accountId,
                toAccountId: null,
                exchangeRate: 1,
                amount: AMOUNT,
                entries: [
                    {
                        accountId,
                        categoryId: null,
                        mccCategoryId: null,
                        type: TransactionEntryTypeEnum.CREDIT,
                        kind: TransactionEntryKindEnum.PRIMARY,
                        amount: AMOUNT,
                        externalId
                    }
                ]
            }),
            title: 'IHR LABOR ORDINATION',
            operatedAt,
            externalId,
            externalSource: ExternalSourceEnum.ERSTE
        })
    );

const scanReceipt = (fingerprint: string, receiptNumber: string, accountId: number) =>
    Effect.gen(function* () {
        const receiptMatchService = yield* ReceiptMatchService;
        const transactionService = yield* TransactionService;
        const input = buildReceipt(fingerprint, receiptNumber);
        const proposal = yield* receiptMatchService.propose(input);

        if (isDefined(proposal.transactionId)) {
            yield* receiptMatchService.attach(proposal.transactionId, input);

            return { kind: proposal.kind, transactionId: proposal.transactionId };
        }

        const amount = convertFromMicroUnits(input.total);
        const transaction = yield* transactionService.createInternal({
            ...createTransactionInput({
                type: TransactionTypeEnum.EXPENSE,
                fromAccountId: accountId,
                toAccountId: null,
                exchangeRate: 1,
                amount,
                entries: [
                    {
                        accountId,
                        categoryId: null,
                        mccCategoryId: null,
                        type: TransactionEntryTypeEnum.CREDIT,
                        kind: TransactionEntryKindEnum.PRIMARY,
                        amount,
                        externalId: null
                    }
                ]
            }),
            title: input.title,
            operatedAt: input.occurredAt,
            externalId: fingerprint,
            externalSource: ExternalSourceEnum.RECEIPT
        });

        yield* receiptMatchService.attach(transaction.id, input);

        return { kind: proposal.kind, transactionId: transaction.id };
    });

const seedCardAccount = Effect.gen(function* () {
    const account = yield* testSeedService.account({ title: 'Erste card', type: AccountTypeEnum.BANK_SYNC, externalId: 'erste-card' });
    const accountRepository = yield* AccountRepository;

    yield* accountRepository.addExternalIdAlias('receipt-card:4242', account.id);

    return account;
});

layer(TestLayer)('consolidation/receipt-expense-duplicate', it => {
    it.effect('merges a receipt-created expense with the later bank import into one ledger effect', () =>
        Effect.gen(function* () {
            const account = yield* seedCardAccount;
            const transactionReceiptRepository = yield* TransactionReceiptRepository;

            const receipt = yield* scanReceipt(FINGERPRINT, 'K2310000301/26-010863', account.id);
            const bankExpense = yield* importBankExpense(account.id);

            expect(receipt.kind).toBe(ReceiptMatchResultKindEnum.NEW);
            expect(yield* runConsolidation()).toEqual({ found: 1, consolidated: 1 });
            expect((yield* testQueryService.fetchTransactionById(bankExpense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE
            );
            yield* expectConsolidationParent(receipt.transactionId, bankExpense.id);
            expect(yield* fetchLedgerBalances([account.id])).toEqual([[account.id, -convertToMicroUnits(AMOUNT)]]);
            expect((yield* transactionReceiptRepository.findByFingerprint(FINGERPRINT))?.transactionId).toBe(bankExpense.id);
            yield* expectSecondConsolidationRunStable();
        }).pipe(Effect.provide(Layer.mergeAll(ReceiptMatchService.layer, TransactionReceiptRepository.layer)))
    );

    it.effect('merges a second same-amount receipt only with the bank row that carries no receipt yet', () =>
        Effect.gen(function* () {
            const account = yield* seedCardAccount;
            const transactionReceiptRepository = yield* TransactionReceiptRepository;

            const firstBankExpense = yield* importBankExpense(account.id, 'erste-first-payment', RECEIPT_OCCURRED_AT);
            const firstReceipt = yield* scanReceipt('first-receipt', '0001', account.id);
            const secondReceipt = yield* scanReceipt('second-receipt', '0002', account.id);
            const secondBankExpense = yield* importBankExpense(account.id, 'erste-second-payment');

            expect(firstReceipt).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: firstBankExpense.id });
            expect(secondReceipt.kind).toBe(ReceiptMatchResultKindEnum.NEW);
            expect(yield* runConsolidation()).toEqual({ found: 1, consolidated: 1 });
            yield* expectConsolidationParent(secondReceipt.transactionId, secondBankExpense.id);
            expect(yield* fetchLedgerBalances([account.id])).toEqual([[account.id, -2 * convertToMicroUnits(AMOUNT)]]);
            expect((yield* transactionReceiptRepository.findByFingerprint('second-receipt'))?.transactionId).toBe(secondBankExpense.id);
            yield* expectSecondConsolidationRunStable();
        }).pipe(Effect.provide(Layer.mergeAll(ReceiptMatchService.layer, TransactionReceiptRepository.layer)))
    );
});
