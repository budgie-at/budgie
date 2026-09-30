import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { RefundPairRepository } from '@budgie/consolidation';
import { CategoryEntityTable, LanguageEnum, TransactionEntryEntityTable } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { seedRefundedExpenseOnCard } from '../harness/seed-refunded-expense-on-card';
import { testDb, TestLayer } from '../harness/test-context';

const EXPENSE_AMOUNT = convertToMicroUnits(120);
const GROCERIES_TITLE = 'Groceries';
const GROCERIES_UKRAINIAN_TITLE = 'Продукти';

layer(TestLayer)('consolidation/refund-candidate-category-translation', it => {
    it.effect('returns the localized default category title for the active language', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const { expense, refunds } = seedRefundedExpenseOnCard('mono-card', {
                expenseAmount: EXPENSE_AMOUNT,
                refundAmounts: [EXPENSE_AMOUNT],
                title: 'Silpo',
                refundTitle: 'Скасування. Silpo'
            });
            const groceriesCategory = testDb
                .select({ id: CategoryEntityTable.id })
                .from(CategoryEntityTable)
                .where(eq(CategoryEntityTable.title, GROCERIES_TITLE))
                .get();

            if (!isDefined(groceriesCategory)) {
                throw new Error(`Missing default category ${GROCERIES_TITLE}`);
            }

            testDb
                .update(TransactionEntryEntityTable)
                .set({ categoryId: groceriesCategory.id })
                .where(eq(TransactionEntryEntityTable.transactionId, expense.id))
                .run();

            const englishCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.EN);
            const ukrainianCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.UK);

            expect(englishCandidates).toMatchObject([{ id: expense.id, categoryTitle: GROCERIES_TITLE }]);
            expect(ukrainianCandidates).toMatchObject([{ id: expense.id, categoryTitle: GROCERIES_UKRAINIAN_TITLE }]);
        })
    );
});
