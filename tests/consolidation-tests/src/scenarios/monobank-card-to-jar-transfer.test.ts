import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const TRANSFER_AMOUNT = 250 * PRECISION;
const INCOME_OFFSET_MS = 5_000;

layer(TestLayer)('consolidation/monobank-card-to-jar-transfer', it => {
    it.effect('auto-consolidates a card top-up expense with the jar incoming transfer', () =>
        Effect.gen(function* () {
            const card = yield* testSeedService.bankSyncAccount('Monobank Black •1234', ExternalSourceEnum.MONOBANK, null);
            const jar = yield* testSeedService.bankSyncAccount(
                'Monobank «Студія»',
                ExternalSourceEnum.MONOBANK,
                null,
                1,
                UserIconNameEnum.PiggyBank
            );
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

            const expense = yield* testSeedService.bankPairExpense(
                { externalId: 'mono-jar-topup-out', operatedAt },
                { accountId: card.id, amount: TRANSFER_AMOUNT, mccCategoryId: transferMcc.id }
            );
            const income = yield* testSeedService.bankPairIncome(
                { externalId: 'mono-jar-topup-in', operatedAt: new Date(operatedAt.getTime() + INCOME_OFFSET_MS) },
                { accountId: jar.id, amount: TRANSFER_AMOUNT, mccCategoryId: transferMcc.id }
            );

            yield* runConsolidation();

            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonical?.fromAccountId).toBe(card.id);
            expect(canonical?.toAccountId).toBe(jar.id);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).toBe(canonical?.id);
            expect((yield* testQueryService.fetchTransactionById(income.id)).consolidationParentTransactionId).toBe(canonical?.id);
        })
    );
});
