import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectConsolidationParent,
    expectRevertRemovedCanonical,
    fetchLedgerBalances,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import {
    REJECTED_PAYMENT_EXPENSE_AMOUNT,
    REJECTED_PAYMENT_FEE_AMOUNT,
    REJECTED_PAYMENT_FEE_TITLE,
    REJECTED_PAYMENT_PRINCIPAL_TITLE
} from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

import type { RejectedPaymentRetryTimelineInterface } from '../harness/interface/rejected-payment-retry-timeline.interface';

const RECEIVED_AMOUNT = 41_000 * PRECISION;
const RETRY_TITLE = 'Єгоров Ігор Віталійович. Коментар: Povernennia pomylkovo otrymanykh koshtiv,  41XK-067E-3KA7-0A94 vid 23.06.2026';

const LEGACY_STATEMENT_TIMELINE: RejectedPaymentRetryTimelineInterface = {
    rejectedAt: new Date('2026-06-23T12:24:10.000Z'),
    principalRefundAt: new Date('2026-06-23T13:37:22.000Z'),
    feeRefundAt: new Date('2026-06-23T13:38:25.000Z'),
    retryAt: new Date('2026-06-23T14:29:26.000Z'),
    receivedAt: new Date('2026-06-23T13:29:34.000Z')
};

const KYIV_STATEMENT_TIMELINE: RejectedPaymentRetryTimelineInterface = {
    rejectedAt: new Date('2026-06-23T11:24:10.000Z'),
    principalRefundAt: new Date('2026-06-23T12:37:22.000Z'),
    feeRefundAt: new Date('2026-06-23T12:38:25.000Z'),
    retryAt: new Date('2026-06-23T13:29:26.000Z'),
    receivedAt: new Date('2026-06-23T13:29:34.000Z')
};

const seedPrivatbankTransaction = (
    kind: 'expense' | 'income',
    externalId: string,
    operatedAt: Date,
    title: string,
    entry: { readonly accountId: number; readonly amount: number; readonly mccCategoryId: number }
) =>
    Effect.gen(function* () {
        const transaction =
            kind === 'expense'
                ? yield* testSeedService.bankPairExpense({ externalId, operatedAt }, entry)
                : yield* testSeedService.bankPairIncome({ externalId, operatedAt }, entry);

        return yield* testSeedService.updateTransaction(transaction.id, { title, externalSource: ExternalSourceEnum.PRIVATBANK });
    });

const seedRejectedPaymentRetry = (timeline: RejectedPaymentRetryTimelineInterface) =>
    Effect.gen(function* () {
        const transferMcc = yield* testQueryService.findMccByCode('4829');
        const card = yield* testSeedService.bankSyncAccount('Privatbank •0356', ExternalSourceEnum.PRIVATBANK, null);
        const fopAccount = yield* testSeedService.bankSyncAccount('Monobank Fop UAH', ExternalSourceEnum.MONOBANK, null);
        const cardEntry = (amount: number) => ({ accountId: card.id, amount, mccCategoryId: transferMcc.id });
        const rejected = yield* seedPrivatbankTransaction(
            'expense',
            'rejected-payment',
            timeline.rejectedAt,
            'Єгоров Ігор Віталійович. Коментар: Povernennia pomylkovo otrymanykh koshtiv',
            cardEntry(REJECTED_PAYMENT_EXPENSE_AMOUNT)
        );
        const principalRefund = yield* seedPrivatbankTransaction(
            'income',
            'rejected-payment-principal-refund',
            timeline.principalRefundAt,
            REJECTED_PAYMENT_PRINCIPAL_TITLE,
            cardEntry(REJECTED_PAYMENT_EXPENSE_AMOUNT)
        );
        const feeRefund = yield* seedPrivatbankTransaction(
            'income',
            'rejected-payment-fee-refund',
            timeline.feeRefundAt,
            REJECTED_PAYMENT_FEE_TITLE,
            cardEntry(REJECTED_PAYMENT_FEE_AMOUNT)
        );
        const retry = yield* seedPrivatbankTransaction(
            'expense',
            'retry-payment',
            timeline.retryAt,
            RETRY_TITLE,
            cardEntry(REJECTED_PAYMENT_EXPENSE_AMOUNT)
        );
        const received = yield* testSeedService.bankPairIncome(
            { externalId: 'fop-uah-receipt', operatedAt: timeline.receivedAt },
            { accountId: fopAccount.id, amount: RECEIVED_AMOUNT, mccCategoryId: transferMcc.id }
        );

        yield* testSeedService.feeEntry(rejected.id, 'rejected-payment-fee', { accountId: card.id, amount: REJECTED_PAYMENT_FEE_AMOUNT });
        yield* testSeedService.feeEntry(retry.id, 'retry-payment-fee', { accountId: card.id, amount: REJECTED_PAYMENT_FEE_AMOUNT });

        return { card, feeRefund, fopAccount, principalRefund, received, rejected, retry };
    });

const expectRetryPairedWithFeeKept = Effect.fnUntraced(function* (timeline: RejectedPaymentRetryTimelineInterface) {
    const { card, feeRefund, fopAccount, principalRefund, received, rejected, retry } = yield* seedRejectedPaymentRetry(timeline);
    const balancesBefore = yield* fetchLedgerBalances([card.id, fopAccount.id]);

    expect(yield* runConsolidation()).toEqual({ found: 3, consolidated: 3 });

    const transferId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
    const transferEntries = yield* fetchOwnLedgerEntries(transferId);

    yield* expectConsolidationParent(retry.id, transferId);
    yield* expectConsolidationParent(received.id, transferId);
    yield* expectConsolidationParent(principalRefund.id, rejected.id);
    yield* expectConsolidationParent(feeRefund.id, rejected.id);
    expect((yield* testQueryService.fetchTransactionById(rejected.id)).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
    expect(transferEntries.map(entry => [entry.type, entry.accountId, entry.amount])).toEqual(
        expect.arrayContaining([
            [TransactionEntryTypeEnum.CREDIT, card.id, REJECTED_PAYMENT_EXPENSE_AMOUNT],
            [TransactionEntryTypeEnum.DEBIT, fopAccount.id, RECEIVED_AMOUNT],
            [TransactionEntryTypeEnum.FEE, card.id, REJECTED_PAYMENT_FEE_AMOUNT]
        ])
    );
    expect(yield* fetchLedgerBalances([card.id, fopAccount.id])).toEqual(balancesBefore);

    const revertedTransferId = yield* revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

    yield* expectRevertRemovedCanonical(revertedTransferId, [retry.id, received.id]);
    expect(yield* fetchLedgerBalances([card.id, fopAccount.id])).toEqual(balancesBefore);
});

layer(TestLayer)('consolidation/rejected-payment-retry-transfer', it => {
    it.effect(
        'pairs the retried payment with its receipt and keeps its fee while the rejected attempt stays a refund (legacy statement times)',
        () => expectRetryPairedWithFeeKept(LEGACY_STATEMENT_TIMELINE)
    );

    it.effect(
        'pairs the retried payment with its receipt and keeps its fee while the rejected attempt stays a refund (Kyiv statement times)',
        () => expectRetryPairedWithFeeKept(KYIV_STATEMENT_TIMELINE)
    );

    it.effect('never pairs a rejected-payment refund as the receiving side of a transfer', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const card = yield* testSeedService.bankSyncAccount('Privatbank •0356', ExternalSourceEnum.PRIVATBANK, null);
            const otherAccount = yield* testSeedService.bankSyncAccount('Monobank Black', ExternalSourceEnum.MONOBANK, null);
            const outgoing = yield* testSeedService.bankPairExpense(
                { externalId: 'same-amount-outgoing', operatedAt: KYIV_STATEMENT_TIMELINE.principalRefundAt },
                { accountId: otherAccount.id, amount: REJECTED_PAYMENT_EXPENSE_AMOUNT, mccCategoryId: transferMcc.id }
            );
            const principalRefund = yield* seedPrivatbankTransaction(
                'income',
                'orphan-principal-refund',
                new Date(KYIV_STATEMENT_TIMELINE.principalRefundAt.getTime() + 5_000),
                REJECTED_PAYMENT_PRINCIPAL_TITLE,
                { accountId: card.id, amount: REJECTED_PAYMENT_EXPENSE_AMOUNT, mccCategoryId: transferMcc.id }
            );

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            expect((yield* testQueryService.fetchTransactionById(outgoing.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(principalRefund.id)).consolidationParentTransactionId).toBeNull();
        })
    );
});
