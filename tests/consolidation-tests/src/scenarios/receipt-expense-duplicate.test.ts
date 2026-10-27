import {
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
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

import { expectConsolidationParent, fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const AMOUNT = 62.1;
const RECEIPT_OCCURRED_AT = new Date('2026-10-27T07:52:00Z');
const BANK_OPERATED_AT = new Date('2026-10-28T09:00:00Z');
const FINGERPRINT = 'ATU71427716|K2310000301/26-010863|62100000|2026-10-27';

const importBankExpense = (accountId: number) =>
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
                        externalId: 'erste-receipt-payment'
                    }
                ]
            }),
            title: 'IHR LABOR ORDINATION',
            operatedAt: BANK_OPERATED_AT,
            externalId: 'erste-receipt-payment',
            externalSource: ExternalSourceEnum.ERSTE
        })
    );

layer(TestLayer)('consolidation/receipt-expense-duplicate', it => {
    it.effect('merges a receipt-created expense with the later bank import into one ledger effect', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({
                title: 'Erste card',
                type: AccountTypeEnum.BANK_SYNC,
                externalId: 'erste-card'
            });
            const accountRepository = yield* AccountRepository;
            const receiptMatchService = yield* ReceiptMatchService;
            const transactionReceiptRepository = yield* TransactionReceiptRepository;

            yield* accountRepository.addExternalIdAlias('receipt-card:4242', account.id);

            const receipt = yield* receiptMatchService.match({
                total: convertToMicroUnits(AMOUNT),
                currency: CurrencyEnum.USD,
                occurredAt: RECEIPT_OCCURRED_AT,
                cardLast4: '4242',
                receiptNumber: 'K2310000301/26-010863',
                merchantVatId: 'ATU71427716',
                merchantLegalName: 'IHR LABOR GesbR',
                merchantCandidates: ['IHR LABOR'],
                fingerprint: FINGERPRINT,
                title: 'Ihr Labor',
                description: null,
                categoryId: null
            });
            const bankExpense = yield* importBankExpense(account.id);

            expect(receipt.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect(yield* runConsolidation()).toEqual({ found: 1, consolidated: 1 });
            expect((yield* testQueryService.fetchTransactionById(bankExpense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE
            );
            yield* expectConsolidationParent(receipt.transactionId, bankExpense.id);
            expect(yield* fetchLedgerBalances([account.id])).toEqual([[account.id, -convertToMicroUnits(AMOUNT)]]);
            expect((yield* transactionReceiptRepository.findByFingerprint(FINGERPRINT))?.transactionId).toBe(receipt.transactionId);
            yield* expectSecondConsolidationRunStable();
        }).pipe(Effect.provide(Layer.mergeAll(ReceiptMatchService.layer, TransactionReceiptRepository.layer)))
    );
});
