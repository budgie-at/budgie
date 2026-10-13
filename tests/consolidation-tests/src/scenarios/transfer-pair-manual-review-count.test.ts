import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const EUR_AMOUNT = 500 * PRECISION;
const UAH_AMOUNT = 25_000 * PRECISION;
const REVIEW_INCOME_DELAY_SECONDS = 3 * 60 * 60;

const seedReviewPair = (suffix: string, operatedAt: Date) =>
    Effect.gen(function* () {
        const transferMcc = yield* testQueryService.findMccByCode('4829');
        const eur = yield* testSeedService.instrument({ code: `E${suffix}`, name: `Euro ${suffix}`, symbol: '€' });
        const eurAccount = yield* testSeedService.bankSyncAccount(`EUR ${suffix}`, ExternalSourceEnum.MONOBANK, null, eur.id);
        const uahAccount = yield* testSeedService.bankSyncAccount(`UAH ${suffix}`, ExternalSourceEnum.PRIVATBANK, null);

        yield* testSeedService.bankPairExpense(
            { externalId: `review-expense-${suffix}`, operatedAt },
            { accountId: eurAccount.id, amount: EUR_AMOUNT, exchangeRate: EUR_AMOUNT / UAH_AMOUNT, mccCategoryId: transferMcc.id }
        );
        yield* testSeedService.bankPairIncome(
            { externalId: `review-income-${suffix}`, operatedAt: new Date(operatedAt.getTime() + REVIEW_INCOME_DELAY_SECONDS * 1000) },
            { accountId: uahAccount.id, amount: UAH_AMOUNT, exchangeRate: UAH_AMOUNT / EUR_AMOUNT, mccCategoryId: transferMcc.id }
        );
    });

layer(TestLayer)('consolidation/transfer-pair-manual-review-count', it => {
    it.effect('counts every cross-currency operation pair left for manual review', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;

            yield* seedReviewPair('A', new Date('2026-03-02T09:00:00.000Z'));
            yield* seedReviewPair('B', new Date('2026-03-12T09:00:00.000Z'));

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            expect(yield* consolidationCoordinatorService.countManualReviewCandidates()).toBe(2);
        })
    );
});
