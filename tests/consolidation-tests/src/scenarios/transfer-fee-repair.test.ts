import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import {
    AccountTypeEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    fetchLedgerBalances,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import { expectConsolidationResult } from '../harness/expect-consolidation-result';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const TRANSFER_AMOUNT = 5_000 * PRECISION;
const TRANSFER_FEE_AMOUNT = 150 * PRECISION;
const ATM_AMOUNT = 500 * PRECISION;
const ATM_FEE_AMOUNT = 5 * PRECISION;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const countCandidates = Effect.flatMap(ConsolidationCoordinatorService, service => service.countMissingTransferFeeRepairCandidates());

const repair = Effect.flatMap(ConsolidationCoordinatorService, service => service.repairMissingTransferFees());

const deleteLiveFeeEntries = (canonicalId: number) =>
    testDb
        .delete(TransactionEntryEntityTable)
        .where(
            and(
                eq(TransactionEntryEntityTable.transactionId, canonicalId),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE),
                isNull(TransactionEntryEntityTable.originalTransactionId)
            )
        );

const fetchLiveFeeEntries = (canonicalId: number) =>
    Effect.map(fetchOwnLedgerEntries(canonicalId), entries => entries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE));

const seedLegacyTransferPairCanonical = () =>
    Effect.gen(function* () {
        const transferMcc = yield* testQueryService.findMccByCode('4829');
        const { expense, fromAccount, toAccount } = yield* testSeedService.amountTransferPair(TRANSFER_AMOUNT, transferMcc.id);

        yield* testSeedService.feeEntry(expense.id, 'legacy-transfer-fee', { accountId: fromAccount.id, amount: TRANSFER_FEE_AMOUNT });

        const balancesBeforeConsolidation = yield* fetchLedgerBalances([fromAccount.id, toAccount.id]);

        yield* expectConsolidationResult({ found: 1, consolidated: 1 });

        const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        yield* deleteLiveFeeEntries(canonicalId);

        return { balancesBeforeConsolidation, canonicalId, fromAccount, toAccount };
    });

layer(TestLayer)('consolidation/transfer-fee-repair', it => {
    it.effect('restores the fee of a legacy transfer pair canonical on the paying account only', () =>
        Effect.gen(function* () {
            const { balancesBeforeConsolidation, canonicalId, fromAccount, toAccount } = yield* seedLegacyTransferPairCanonical();
            const [[, fromBalanceWithoutFee], [, toBalanceWithoutFee]] = yield* fetchLedgerBalances([fromAccount.id, toAccount.id]);

            expect(yield* countCandidates).toBe(1);
            expect(yield* repair).toBe(1);

            const feeEntries = yield* fetchLiveFeeEntries(canonicalId);

            expect(feeEntries.map(entry => [entry.accountId, entry.amount])).toEqual([[fromAccount.id, TRANSFER_FEE_AMOUNT]]);
            expect(yield* fetchLedgerBalances([fromAccount.id, toAccount.id])).toEqual([
                [fromAccount.id, fromBalanceWithoutFee - TRANSFER_FEE_AMOUNT],
                [toAccount.id, toBalanceWithoutFee]
            ]);
            expect(yield* fetchLedgerBalances([fromAccount.id, toAccount.id])).toEqual(balancesBeforeConsolidation);
        })
    );

    it.effect('is stable on a second pass', () =>
        Effect.gen(function* () {
            const { canonicalId } = yield* seedLegacyTransferPairCanonical();

            yield* repair;

            expect(yield* countCandidates).toBe(0);
            expect(yield* repair).toBe(0);
            expect(yield* fetchLiveFeeEntries(canonicalId)).toHaveLength(1);
        })
    );

    it.effect('does not touch a canonical that already carries its fee', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { expense, fromAccount } = yield* testSeedService.amountTransferPair(TRANSFER_AMOUNT, transferMcc.id);

            yield* testSeedService.feeEntry(expense.id, 'healthy-transfer-fee', { accountId: fromAccount.id, amount: TRANSFER_FEE_AMOUNT });
            yield* expectConsolidationResult({ found: 1, consolidated: 1 });

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(yield* countCandidates).toBe(0);
            expect(yield* repair).toBe(0);
            expect(yield* fetchLiveFeeEntries(canonicalId)).toHaveLength(1);
        })
    );

    it.effect('restores the pre-consolidation balances when the repaired canonical is unconsolidated', () =>
        Effect.gen(function* () {
            const { balancesBeforeConsolidation, fromAccount, toAccount } = yield* seedLegacyTransferPairCanonical();

            yield* repair;
            yield* revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(yield* fetchLedgerBalances([fromAccount.id, toAccount.id])).toEqual(balancesBeforeConsolidation);
        })
    );

    it.effect('restores the fee of a legacy ATM cash withdrawal canonical', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const bankAccount = yield* testSeedService.account({ title: 'Atm Bank', type: AccountTypeEnum.BANK_SYNC });
            yield* testSeedService.account({ title: 'Atm Cash', type: AccountTypeEnum.CASH });
            const expense = yield* testSeedService.bankPairExpense(
                { externalId: 'tx-atm-legacy', operatedAt: new Date(Date.now() - DAY_MILLISECONDS) },
                { accountId: bankAccount.id, amount: ATM_AMOUNT, mccCategoryId: (yield* testQueryService.findMccByCode('6011')).id }
            );

            yield* testSeedService.feeEntry(expense.id, 'tx-atm-legacy-fee', { accountId: bankAccount.id, amount: ATM_FEE_AMOUNT });
            yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id]);

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

            yield* deleteLiveFeeEntries(canonicalId);

            expect(yield* countCandidates).toBe(1);
            expect(yield* repair).toBe(1);
            expect((yield* fetchLiveFeeEntries(canonicalId)).map(entry => [entry.accountId, entry.amount])).toEqual([
                [bankAccount.id, ATM_FEE_AMOUNT]
            ]);
            expect(yield* repair).toBe(0);
        })
    );
});
