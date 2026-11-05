import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const OPERATED_AT = new Date('2026-06-23T12:00:00.000Z');
const BOOKED_AT_NOON = OPERATED_AT;
const OTHER_PROVIDER_AT = new Date('2026-06-23T15:00:00.000Z');
const USD_AMOUNT = 100 * PRECISION;
const EUR_AMOUNT = 92 * PRECISION;

const seedCrossCurrencyRows = (source: ExternalSourceEnum) =>
    Effect.gen(function* () {
        const usd = yield* testSeedService.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
        const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const usdAccount = yield* testSeedService.bankSyncAccount('First bank USD', source, null, usd.id);
        const eurAccount = yield* testSeedService.bankSyncAccount('Second bank EUR', source, null, eur.id);
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: 'usd-expense', operatedAt: OPERATED_AT },
            { accountId: usdAccount.id, amount: USD_AMOUNT, exchangeRate: 1, mccCategoryId: null }
        );
        const income = yield* testSeedService.bankPairIncome(
            { externalId: 'eur-income', operatedAt: OPERATED_AT },
            { accountId: eurAccount.id, amount: EUR_AMOUNT, exchangeRate: 1, mccCategoryId: null }
        );

        return { expense, income };
    });

layer(TestLayer)('consolidation/enable-banking-transfer-pairing', it => {
    it.effect('never treats two Enable Banking accounts as the same bank for an unrelated USD expense and EUR income', () =>
        Effect.gen(function* () {
            const rows = yield* seedCrossCurrencyRows(ExternalSourceEnum.ENABLE_BANKING);

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            for (const { id } of Object.values(rows)) {
                expect((yield* testQueryService.fetchTransactionById(id)).consolidationParentTransactionId).toBeNull();
            }
        })
    );

    it.effect('still pairs the same rows on one real bank', () =>
        Effect.gen(function* () {
            yield* seedCrossCurrencyRows(ExternalSourceEnum.MONOBANK);

            expect((yield* runConsolidation()).consolidated).toBe(1);
        })
    );

    it.effect('does not pair a refund on another Enable Banking account in another currency', () =>
        Effect.gen(function* () {
            const usd = yield* testSeedService.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
            const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const usdAccount = yield* testSeedService.bankSyncAccount('First bank USD', ExternalSourceEnum.ENABLE_BANKING, null, usd.id);
            const eurAccount = yield* testSeedService.bankSyncAccount('Second bank EUR', ExternalSourceEnum.ENABLE_BANKING, null, eur.id);
            const expense = yield* testSeedService.bankPairExpense(
                { externalId: 'merchant-expense', operatedAt: OPERATED_AT },
                { accountId: usdAccount.id, amount: USD_AMOUNT, exchangeRate: 1, mccCategoryId: null }
            );
            yield* testSeedService.updateTransaction(expense.id, { title: 'SYNTHETIC SHOP' });
            const refund = yield* testSeedService.bankPairIncome(
                { externalId: 'merchant-refund', operatedAt: OPERATED_AT },
                { accountId: eurAccount.id, amount: EUR_AMOUNT, exchangeRate: 1, mccCategoryId: null }
            );
            yield* testSeedService.updateTransaction(refund.id, { title: 'SYNTHETIC SHOP' });

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
        })
    );

    it.effect('a noon booking reaches a 15:00 transfer leg on another provider that midnight would miss', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const enableBankingAccount = yield* testSeedService.bankSyncAccount('Booked bank', ExternalSourceEnum.ENABLE_BANKING, null);
            const monobankAccount = yield* testSeedService.bankSyncAccount('Monobank card', ExternalSourceEnum.MONOBANK, null);
            yield* testSeedService.bankPairExpense(
                { externalId: 'booked-leg', operatedAt: BOOKED_AT_NOON },
                { accountId: enableBankingAccount.id, amount: USD_AMOUNT, exchangeRate: 1, mccCategoryId: transferMcc.id }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'instant-leg', operatedAt: OTHER_PROVIDER_AT },
                { accountId: monobankAccount.id, amount: USD_AMOUNT, exchangeRate: 1, mccCategoryId: transferMcc.id }
            );

            expect((yield* runConsolidation()).consolidated).toBe(1);
        })
    );
});
