import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const OPERATED_AT = new Date('2026-06-23T12:00:00.000Z');
const BOOKED_AT_NOON = OPERATED_AT;
const OTHER_PROVIDER_AT = new Date('2026-06-23T15:00:00.000Z');
const HALF_HOUR_LATER = new Date('2026-06-23T12:30:00.000Z');
const USD_AMOUNT = 100 * PRECISION;
const EUR_AMOUNT = 92 * PRECISION;

const seedConnectionAccount = (title: string, source: ExternalSourceEnum, instrumentId: number, consent: string | null) =>
    Effect.gen(function* () {
        const account = yield* testSeedService.bankSyncAccount(title, source, null, instrumentId);
        if (isDefined(consent)) {
            yield* testSeedService.sync({ accountId: account.id, provider: source, token: consent });
        }

        return account;
    });

const seedCrossCurrencyRows = (source: ExternalSourceEnum, expenseConsent: string | null, incomeConsent: string | null) =>
    Effect.gen(function* () {
        const usd = yield* testSeedService.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
        const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const usdAccount = yield* seedConnectionAccount('First balance USD', source, usd.id, expenseConsent);
        const eurAccount = yield* seedConnectionAccount('Second balance EUR', source, eur.id, incomeConsent);
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: 'usd-expense', operatedAt: OPERATED_AT },
            { accountId: usdAccount.id, amount: USD_AMOUNT, exchangeRate: 1, mccCategoryId: null }
        );
        const income = yield* testSeedService.bankPairIncome(
            { externalId: 'eur-income', operatedAt: OPERATED_AT },
            { accountId: eurAccount.id, amount: EUR_AMOUNT, exchangeRate: 1, mccCategoryId: null }
        );

        return { expense, income, usdAccount, eurAccount };
    });

layer(TestLayer)('consolidation/enable-banking-transfer-pairing', it => {
    it.effect('never treats accounts of two Enable Banking connections as the same bank for a USD expense and EUR income', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyRows(ExternalSourceEnum.ENABLE_BANKING, 'consent-a', 'consent-b');

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            for (const { id } of [expense, income]) {
                expect((yield* testQueryService.fetchTransactionById(id)).consolidationParentTransactionId).toBeNull();
            }
        })
    );

    it.effect('never treats Enable Banking accounts without a connection as the same bank for a USD expense and EUR income', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyRows(ExternalSourceEnum.ENABLE_BANKING, null, null);

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            for (const { id } of [expense, income]) {
                expect((yield* testQueryService.fetchTransactionById(id)).consolidationParentTransactionId).toBeNull();
            }
        })
    );

    it.effect('pairs a conversion between two balances of one Enable Banking connection', () =>
        Effect.gen(function* () {
            const { expense, income, usdAccount, eurAccount } = yield* seedCrossCurrencyRows(
                ExternalSourceEnum.ENABLE_BANKING,
                'consent-wise',
                'consent-wise'
            );

            expect((yield* runConsolidation()).consolidated).toBe(1);
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonical).toMatchObject({ fromAccountId: usdAccount.id, toAccountId: eurAccount.id });
            const childIds = yield* testQueryService.fetchChildTransactionIds(canonical.id);
            expect(childIds).toHaveLength(2);
            expect(new Set(childIds)).toEqual(new Set([expense.id, income.id]));
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('still pairs the same rows on one real bank', () =>
        Effect.gen(function* () {
            yield* seedCrossCurrencyRows(ExternalSourceEnum.MONOBANK, null, null);

            expect((yield* runConsolidation()).consolidated).toBe(1);
        })
    );

    it.effect('does not pair a refund on another Enable Banking connection in another currency', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedCrossCurrencyRows(ExternalSourceEnum.ENABLE_BANKING, 'consent-a', 'consent-b');
            yield* testSeedService.updateTransaction(expense.id, { title: 'SYNTHETIC SHOP' });
            yield* testSeedService.updateTransaction(income.id, { title: 'SYNTHETIC SHOP' });

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
        })
    );

    it.effect('pairs a same-currency transfer with a fee between two Enable Banking connections as interbank', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const source = yield* seedConnectionAccount('Bank A EUR', ExternalSourceEnum.ENABLE_BANKING, eur.id, 'consent-a');
            const target = yield* seedConnectionAccount('Bank B EUR', ExternalSourceEnum.ENABLE_BANKING, eur.id, 'consent-b');
            yield* testSeedService.bankPairExpense(
                { externalId: 'interbank-out', operatedAt: OPERATED_AT },
                { accountId: source.id, amount: 200 * PRECISION, exchangeRate: 1, mccCategoryId: transferMcc.id }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'interbank-in', operatedAt: HALF_HOUR_LATER },
                { accountId: target.id, amount: 199 * PRECISION, exchangeRate: 1, mccCategoryId: transferMcc.id }
            );

            expect((yield* runConsolidation()).consolidated).toBe(1);
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
