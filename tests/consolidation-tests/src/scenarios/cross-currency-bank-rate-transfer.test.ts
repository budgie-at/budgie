import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectConsolidationParent, fetchLedgerBalances, fetchOwnLedgerEntries } from '../harness/consolidation-revert-audit';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

import type { CrossCurrencyTransferSeedInputInterface } from '../harness/interface/cross-currency-transfer-seed-input.interface';

const EUR_AMOUNT = 803.14 * PRECISION;
const UAH_AMOUNT = 41_000 * PRECISION;
const EUR_PER_UAH = 803.14 / 41_000;
const UAH_PER_EUR = 41_000 / 803.14;
const EXPENSE_OPERATED_AT = new Date('2026-06-23T10:48:50.000Z');
const LEGACY_INCOME_DELAY_SECONDS = 65 * 60;
const WINDOW_SECONDS = 2 * 60 * 60;

const seedCrossCurrencyTransfer = (input: CrossCurrencyTransferSeedInputInterface = {}) =>
    Effect.gen(function* () {
        const transferMcc = yield* testQueryService.findMccByCode('4829');
        const mccCategoryId = (input.isTransferMcc ?? true) ? transferMcc.id : null;
        const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const eurAccount = yield* testSeedService.bankSyncAccount('Monobank Fop EUR', ExternalSourceEnum.MONOBANK, null, eur.id);
        const uahAccount = yield* testSeedService.bankSyncAccount(
            'Privatbank •0356',
            input.receivingBank ?? ExternalSourceEnum.PRIVATBANK,
            null
        );
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: 'fop-eur-top-up', operatedAt: EXPENSE_OPERATED_AT },
            { accountId: eurAccount.id, amount: EUR_AMOUNT, exchangeRate: input.expenseExchangeRate ?? EUR_PER_UAH, mccCategoryId }
        );
        const income = yield* testSeedService.bankPairIncome(
            {
                externalId: 'privatbank-top-up',
                operatedAt: new Date(EXPENSE_OPERATED_AT.getTime() + (input.incomeDelaySeconds ?? LEGACY_INCOME_DELAY_SECONDS) * 1000)
            },
            {
                accountId: uahAccount.id,
                amount: input.incomeAmount ?? UAH_AMOUNT,
                exchangeRate: input.incomeExchangeRate ?? 1,
                mccCategoryId
            }
        );

        return { eurAccount, expense, income, transferMcc, uahAccount };
    });

const expectNothingPaired = (transactionIds: readonly number[]) =>
    Effect.gen(function* () {
        expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });

        for (const transactionId of transactionIds) {
            expect((yield* testQueryService.fetchTransactionById(transactionId)).consolidationParentTransactionId).toBeNull();
        }
    });

layer(TestLayer)('consolidation/cross-currency-bank-rate-transfer', it => {
    it.effect('pairs a EUR top-up with its UAH receipt using the rate the bank stored on the expense only', () =>
        Effect.gen(function* () {
            const { eurAccount, expense, income, uahAccount } = yield* seedCrossCurrencyTransfer();
            const balancesBefore = yield* fetchLedgerBalances([eurAccount.id, uahAccount.id]);

            expect(yield* runConsolidation()).toEqual({ found: 1, consolidated: 1 });

            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            const ownEntries = yield* fetchOwnLedgerEntries(canonical.id);

            expect(canonical).toMatchObject({ fromAccountId: eurAccount.id, toAccountId: uahAccount.id });
            expect(ownEntries.map(entry => [entry.type, entry.accountId, entry.amount])).toEqual(
                expect.arrayContaining([
                    [TransactionEntryTypeEnum.CREDIT, eurAccount.id, EUR_AMOUNT],
                    [TransactionEntryTypeEnum.DEBIT, uahAccount.id, UAH_AMOUNT]
                ])
            );
            yield* expectConsolidationParent(expense.id, canonical.id);
            yield* expectConsolidationParent(income.id, canonical.id);
            expect(yield* fetchLedgerBalances([eurAccount.id, uahAccount.id])).toEqual(balancesBefore);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('pairs the transfer when only the receiving side carries the bank rate', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyTransfer({ expenseExchangeRate: 1, incomeExchangeRate: UAH_PER_EUR });

            expect((yield* runConsolidation()).consolidated).toBe(1);

            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            yield* expectConsolidationParent(expense.id, canonical.id);
            yield* expectConsolidationParent(income.id, canonical.id);
        })
    );

    it.effect('skips a receipt more than one cent away from the bank-rate amount', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyTransfer({ incomeAmount: UAH_AMOUNT + 0.02 * PRECISION });

            yield* expectNothingPaired([expense.id, income.id]);
        })
    );

    it.effect('skips a receipt more than two hours after the expense', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyTransfer({ incomeDelaySeconds: WINDOW_SECONDS + 1 });

            yield* expectNothingPaired([expense.id, income.id]);
        })
    );

    it.effect('skips the pair when neither side has a transfer MCC', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyTransfer({ isTransferMcc: false });

            yield* expectNothingPaired([expense.id, income.id]);
        })
    );

    it.effect('skips the pair when a second receipt fits the same bank-rate amount', () =>
        Effect.gen(function* () {
            const { expense, income, transferMcc, uahAccount } = yield* seedCrossCurrencyTransfer();
            const competingIncome = yield* testSeedService.bankPairIncome(
                { externalId: 'privatbank-competing-top-up', operatedAt: new Date(EXPENSE_OPERATED_AT.getTime() + 30 * 60 * 1000) },
                { accountId: uahAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
            );

            yield* expectNothingPaired([expense.id, income.id, competingIncome.id]);
        })
    );
    it.effect('leaves a same-bank conversion minutes apart to the same-second same-bank rule', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyTransfer({ receivingBank: ExternalSourceEnum.MONOBANK });

            yield* expectNothingPaired([expense.id, income.id]);
        })
    );
});
