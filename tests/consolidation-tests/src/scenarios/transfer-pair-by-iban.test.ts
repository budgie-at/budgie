import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const EUR_IBAN = 'UA-FOP-EUR';
const UAH_IBAN = 'UA-FOP-UAH';
const CONVERSION_OPERATED_AT = new Date(2026, 7, 5, 9, 0, 0);

const seedSameBankIbanConversion = (incomeDelayMs: number) =>
    Effect.gen(function* () {
        const transferMcc = yield* testQueryService.findMccByCode('4829');
        const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const eurAccount = yield* testSeedService.bankSyncAccount('Monobank Fop EUR', ExternalSourceEnum.MONOBANK, EUR_IBAN, eur.id);
        const uahAccount = yield* testSeedService.bankSyncAccount('Monobank Fop UAH', ExternalSourceEnum.MONOBANK, UAH_IBAN);
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: 'fop-eur-conversion', operatedAt: CONVERSION_OPERATED_AT },
            { accountId: eurAccount.id, amount: 9.77 * PRECISION, exchangeRate: 0.01954, mccCategoryId: transferMcc.id, toIban: UAH_IBAN }
        );
        const income = yield* testSeedService.bankPairIncome(
            { externalId: 'fop-uah-conversion', operatedAt: new Date(CONVERSION_OPERATED_AT.getTime() + incomeDelayMs) },
            { accountId: uahAccount.id, amount: 500 * PRECISION, mccCategoryId: transferMcc.id, toIban: EUR_IBAN }
        );

        return { eurAccount, expense, income, uahAccount };
    });

layer(TestLayer)('consolidation/transfer-pair-by-iban', it => {
    it.effect('promotes matching expense and income counter-IBAN rows into a canonical transfer', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { fromAccount, toAccount } = yield* testSeedService.accountPair('UA-FROM', 'UA-TO');
            const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
            const expense = yield* testSeedService.bankPairExpense(
                { externalId: 'iban-expense', operatedAt },
                { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id, toIban: 'UA-TO' }
            );
            const income = yield* testSeedService.bankPairIncome(
                { externalId: 'iban-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
                { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
            );
            const tag = yield* testSeedService.tag('Transfer Source');
            yield* testSeedService.transactionTag(expense.id, tag.id);
            yield* testSeedService.transactionTag(income.id, tag.id);

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(1);

            const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonicals).toHaveLength(1);
            expect(canonicals[0].type).toBe(TransactionTypeEnum.TRANSFER);
            expect(canonicals[0].fromAccountId).toBe(fromAccount.id);
            expect(canonicals[0].toAccountId).toBe(toAccount.id);

            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBe(canonicals[0].id);
            expect((yield* testQueryService.fetchTransactionById(income.id)).consolidationParentTransactionId).toBe(canonicals[0].id);

            const movedEntries = yield* testQueryService.fetchEntriesByTransactionId(canonicals[0].id);
            const sourceIds = movedEntries.flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []));
            expect(sourceIds.sort()).toEqual([expense.id, income.id].sort());
            expect(yield* testQueryService.fetchTransactionTagIds(canonicals[0].id)).toHaveLength(0);
        })
    );

    it.effect('pairs a same-second same-bank currency conversion whose counter-IBAN matches', () =>
        Effect.gen(function* () {
            const { eurAccount, expense, income, uahAccount } = yield* seedSameBankIbanConversion(0);

            expect((yield* runConsolidation()).consolidated).toBe(1);
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonical.fromAccountId).toBe(eurAccount.id);
            expect(canonical.toAccountId).toBe(uahAccount.id);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBe(canonical.id);
            expect((yield* testQueryService.fetchTransactionById(income.id)).consolidationParentTransactionId).toBe(canonical.id);
        })
    );

    it.effect('keeps a counter-IBAN currency conversion unpaired when the legs are minutes apart', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedSameBankIbanConversion(5 * 60_000);

            expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(income.id)).consolidationParentTransactionId).toBeNull();
        })
    );
});
