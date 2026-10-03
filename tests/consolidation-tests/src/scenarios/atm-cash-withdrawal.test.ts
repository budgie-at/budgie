import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountTypeEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectConsolidationParent,
    expectRevertRemovedCanonical,
    expectSourceStateRestored,
    fetchLedgerBalances,
    fetchLedgerEntry,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId,
    revertSingleCanonical,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const ATM_WITHDRAWAL_AMOUNT = 500 * PRECISION;
const ATM_WITHDRAWAL_FEE_AMOUNT = 5 * PRECISION;
const ATM_CANONICAL_LEDGER_ENTRY_COUNT = 3;
const ATM_EXPENSE_LEDGER_ENTRY_COUNT = 2;
const ATM_MCC = '6011';
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const ATM_OPERATED_AT = new Date(Date.now() - DAY_MILLISECONDS);
const HISTORICAL_ATM_OPERATED_AT = new Date(Date.now() - 400 * DAY_MILLISECONDS);

const seedAtmExpense = (bankAccountId: number, externalId: string, operatedAt: Date) =>
    Effect.gen(function* () {
        const expense = yield* testSeedService.bankPairExpense(
            { externalId, operatedAt },
            { accountId: bankAccountId, amount: ATM_WITHDRAWAL_AMOUNT, mccCategoryId: (yield* testQueryService.findMccByCode(ATM_MCC)).id }
        );

        yield* testSeedService.feeEntry(expense.id, `${externalId}-fee`, { accountId: bankAccountId, amount: ATM_WITHDRAWAL_FEE_AMOUNT });

        return expense;
    });

const seedAtmCashWithdrawalFixture = () =>
    Effect.gen(function* () {
        const bankAccount = yield* testSeedService.account({ title: 'Atm Bank', type: AccountTypeEnum.BANK_SYNC });
        const cashAccount = yield* testSeedService.account({ title: 'Atm Cash', type: AccountTypeEnum.CASH });
        const expense = yield* seedAtmExpense(bankAccount.id, 'tx-atm', ATM_OPERATED_AT);

        return { bankAccount, cashAccount, expense };
    });

const fetchAtmCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
    });

layer(TestLayer)('consolidation/atm-cash-withdrawal', it => {
    it.effect('never moves a recent or historical ATM expense to cash without the user', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, expense } = yield* seedAtmCashWithdrawalFixture();
            const historicalExpense = yield* seedAtmExpense(bankAccount.id, 'tx-atm-historical', HISTORICAL_ATM_OPERATED_AT);
            const balancesBefore = yield* fetchLedgerBalances([bankAccount.id, cashAccount.id]);

            expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(historicalExpense.id)).consolidationParentTransactionId).toBeNull();
            expect(yield* fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual(balancesBefore);
        })
    );

    it.effect('moves only the selected ATM expense to cash with its fee entry and ignores a repeated move', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const { bankAccount, cashAccount, expense } = yield* seedAtmCashWithdrawalFixture();
            const otherExpense = yield* seedAtmExpense(bankAccount.id, 'tx-atm-other', ATM_OPERATED_AT);

            expect(yield* consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds([expense.id])).toEqual([expense.id]);
            expect(yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id])).toBe(1);

            const canonicalId = yield* fetchAtmCanonicalId();

            yield* expectConsolidationParent(expense.id, canonicalId);
            expect((yield* testQueryService.fetchTransactionById(otherExpense.id)).consolidationParentTransactionId).toBeNull();
            expect(yield* fetchOwnLedgerEntries(canonicalId)).toHaveLength(ATM_CANONICAL_LEDGER_ENTRY_COUNT);
            expect((yield* fetchLedgerEntry(canonicalId, cashAccount.id)).amount).toBe(ATM_WITHDRAWAL_AMOUNT);
            expect(yield* fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual([
                [bankAccount.id, -2 * (ATM_WITHDRAWAL_AMOUNT + ATM_WITHDRAWAL_FEE_AMOUNT)],
                [cashAccount.id, ATM_WITHDRAWAL_AMOUNT]
            ]);
            expect(yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id])).toBe(0);
            expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });
            expect(yield* fetchAtmCanonicalId()).toBe(canonicalId);
        })
    );

    it.effect('does not move an ATM expense when its currency has no single active cash account', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const { expense } = yield* seedAtmCashWithdrawalFixture();
            yield* testSeedService.account({ title: 'Second Cash', type: AccountTypeEnum.CASH });

            expect(yield* consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds([expense.id])).toEqual([]);
            expect(yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id])).toBe(0);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('restores the ATM expense with its fee entry and clears the cash balance when reverted', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const { bankAccount, cashAccount, expense } = yield* seedAtmCashWithdrawalFixture();
            const stateBefore = yield* snapshotSourceState([expense.id]);
            const balancesBefore = yield* fetchLedgerBalances([bankAccount.id, cashAccount.id]);

            yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id]);

            yield* expectRevertRemovedCanonical(yield* revertSingleCanonical(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL), [
                expense.id
            ]);
            yield* expectSourceStateRestored(stateBefore);
            expect(yield* fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual(balancesBefore);
            expect(yield* fetchOwnLedgerEntries(expense.id)).toHaveLength(ATM_EXPENSE_LEDGER_ENTRY_COUNT);
        })
    );
});
