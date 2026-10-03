import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { RefundPairRepository } from '@budgie/consolidation';
import { LanguageEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const LIME_AMOUNT_UAH = 898;
const LIME_AMOUNT = convertToMicroUnits(LIME_AMOUNT_UAH);
const POSLUGY_AMOUNT_UAH = 85;
const POSLUGY_AMOUNT = convertToMicroUnits(POSLUGY_AMOUNT_UAH);
const COMFY_AMOUNT_UAH = 8_378.4;
const COMFY_AMOUNT = convertToMicroUnits(COMFY_AMOUNT_UAH);
const OBB_AMOUNT_UAH = 3_963.9;
const OBB_AMOUNT = convertToMicroUnits(OBB_AMOUNT_UAH);
const FIRST_OBB_OPERATED_AT = new Date('2024-12-10T19:40:59');
const SECOND_OBB_OPERATED_AT = new Date('2024-12-10T19:43:29');
const FIRST_OBB_REFUND_DELAY_SECONDS = 68;
const SECOND_OBB_REFUND_DELAY_SECONDS = 71;

const expectLocalizedAutoCandidate = Effect.fnUntraced(function* (input: {
    readonly accountExternalId: string;
    readonly amount: number;
    readonly title: string;
    readonly refundTitle: string;
}) {
    const refundPairRepository = yield* RefundPairRepository;
    const account = yield* testSeedService.account({ externalId: input.accountExternalId });
    const { expense, refunds } = yield* testSeedService.refundedExpense({
        accountId: account.id,
        expenseAmount: input.amount,
        refundAmounts: [input.amount],
        title: input.title,
        refundTitle: input.refundTitle
    });

    const candidates = yield* refundPairRepository.findCandidates();

    expect(candidates).toEqual([
        {
            confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
            matchType: 'localized-refund-title',
            accountId: account.id,
            expenseTransactionId: expense.id,
            expenseEntryAmount: input.amount,
            refundIncomeTransactionIds: [refunds[0].id],
            refundsTotal: input.amount
        }
    ]);

    return { expense, refunds };
});

layer(TestLayer)('consolidation/refund-pair-by-title-candidates', it => {
    it.effect('ranks a localized refund prefix as a single automatic refund candidate', () =>
        Effect.gen(function* () {
            yield* expectLocalizedAutoCandidate({
                accountExternalId: 'mono-card',
                amount: LIME_AMOUNT,
                title: 'Lime',
                refundTitle: 'Скасування. Lime'
            });
        })
    );

    it.effect('ranks a PrivatBank refund prefix as a single automatic refund candidate', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const { expense, refunds } = yield* expectLocalizedAutoCandidate({
                accountExternalId: 'privat-card',
                amount: POSLUGY_AMOUNT,
                title: 'Послуги',
                refundTitle: 'ПОВЕРНЕННЯ КОШТІВ, Послуги'
            });

            const incomeCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.EN);
            expect(incomeCandidates).toMatchObject([{ id: expense.id, isRecommended: true }]);
        })
    );

    it.effect('ranks a Monobank payment refund prefix as a single automatic refund candidate', () =>
        Effect.gen(function* () {
            yield* expectLocalizedAutoCandidate({
                accountExternalId: 'mono-card',
                amount: COMFY_AMOUNT,
                title: 'Платіж COMFY',
                refundTitle: 'Повернення платежу COMFY'
            });
        })
    );

    it.effect('auto-consolidates cancellation-prefixed card reversals to the nearest same-amount expense', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const first = yield* testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: OBB_AMOUNT,
                refundAmounts: [OBB_AMOUNT],
                title: 'OBB',
                refundTitle: 'Скасування. OBB',
                expenseOperatedAt: FIRST_OBB_OPERATED_AT,
                refundDelaySeconds: FIRST_OBB_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'obb-first'
            });
            const second = yield* testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: OBB_AMOUNT,
                refundAmounts: [OBB_AMOUNT],
                title: 'OBB',
                refundTitle: 'Скасування. OBB',
                expenseOperatedAt: SECOND_OBB_OPERATED_AT,
                refundDelaySeconds: SECOND_OBB_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'obb-second'
            });

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(2);
            expect((yield* testQueryService.fetchTransactionById(first.expense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );
            expect((yield* testQueryService.fetchTransactionById(first.refunds[0].id)).consolidationParentTransactionId).toBe(
                first.expense.id
            );
            expect((yield* testQueryService.fetchTransactionById(second.expense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );
            expect((yield* testQueryService.fetchTransactionById(second.refunds[0].id)).consolidationParentTransactionId).toBe(
                second.expense.id
            );
        })
    );
});
