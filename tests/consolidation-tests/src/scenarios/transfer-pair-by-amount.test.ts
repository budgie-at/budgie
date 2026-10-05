import {
    AccountBalanceRepository,
    AccountRepository,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    fetchLedgerBalances,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import { expectConsolidationResult } from '../harness/expect-consolidation-result';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const SLOW_WINDOW_OFFSET_MS = 30 * 60 * 1000;
const TRANSFER_FEE_AMOUNT = 150 * PRECISION;

layer(TestLayer)('consolidation/transfer-pair-by-amount', it => {
    it.effect('consolidates amount and transfer-MCC matches through consolidation services', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { expense, income } = yield* testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

            yield* expectConsolidationResult({ found: 1, consolidated: 1 });

            const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonicals).toHaveLength(1);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBe(canonicals[0].id);
            expect((yield* testQueryService.fetchTransactionById(income.id)).consolidationParentTransactionId).toBe(canonicals[0].id);
        })
    );

    it.effect('keeps moved source entries out of account balance calculations', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { fromAccount, toAccount } = yield* testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

            yield* runConsolidation();

            const fromBalance = (yield* accountBalanceRepository.getByAccountId(fromAccount.id)).at(0);
            const toBalance = (yield* accountBalanceRepository.getByAccountId(toAccount.id)).at(0);

            expect(fromBalance?.balance).toBe(-250 * PRECISION);
            expect(toBalance?.balance).toBe(250 * PRECISION);
        })
    );

    it.effect('keeps the bank fee of a paired transfer on its account and restores it on revert', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { expense, fromAccount, toAccount } = yield* testSeedService.amountTransferPair(5_000 * PRECISION, transferMcc.id);

            yield* testSeedService.feeEntry(expense.id, 'transfer-fee', { accountId: fromAccount.id, amount: TRANSFER_FEE_AMOUNT });

            const balancesBefore = yield* fetchLedgerBalances([fromAccount.id, toAccount.id]);

            yield* expectConsolidationResult({ found: 1, consolidated: 1 });

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            const canonicalFeeEntries = (yield* fetchOwnLedgerEntries(canonicalId)).filter(
                entry => entry.type === TransactionEntryTypeEnum.FEE
            );

            expect(canonicalFeeEntries.map(entry => [entry.accountId, entry.amount])).toEqual([[fromAccount.id, TRANSFER_FEE_AMOUNT]]);
            expect(yield* fetchLedgerBalances([fromAccount.id, toAccount.id])).toEqual(balancesBefore);

            yield* revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(yield* fetchLedgerBalances([fromAccount.id, toAccount.id])).toEqual(balancesBefore);
        })
    );

    it.effect('auto-consolidates amount and transfer-MCC matches outside the fast window', () =>
        Effect.gen(function* () {
            const { fromAccount, toAccount } = yield* testSeedService.accountPair();
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
            const slowOperatedAt = new Date(operatedAt.getTime() + SLOW_WINDOW_OFFSET_MS);

            yield* testSeedService.bankPairExpense(
                { externalId: 'slow-expense', operatedAt },
                { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'slow-income', operatedAt: slowOperatedAt },
                { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
            );

            yield* expectConsolidationResult({ found: 1, consolidated: 1 });
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
        })
    );

    it.effect('leaves matching amounts unconsolidated without IBAN or transfer MCC evidence', () =>
        Effect.gen(function* () {
            const { fromAccount, toAccount } = yield* testSeedService.accountPair();
            const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

            yield* testSeedService.bankPairExpense(
                { externalId: 'missing-evidence-expense', operatedAt },
                { accountId: fromAccount.id, amount: 250 * PRECISION }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'missing-evidence-income', operatedAt },
                { accountId: toAccount.id, amount: 250 * PRECISION }
            );

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
        })
    );

    it.effect('leaves amount transfers from inactive source accounts unconsolidated', () =>
        Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { fromAccount } = yield* testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

            yield* accountRepository.updateById(fromAccount.id, { isActive: false });

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
        })
    );

    it.effect('leaves amount transfers to inactive target accounts unconsolidated', () =>
        Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { toAccount } = yield* testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

            yield* accountRepository.updateById(toAccount.id, { isActive: false });

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
        })
    );
});
