import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { CategoryEntityTable, LanguageEnum, TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { refundPairRepository, testDb, testSeedService } from '../harness/test-context';

const EXPENSE_AMOUNT = convertToMicroUnits(120);
const GROCERIES_TITLE = 'Groceries';
const GROCERIES_UKRAINIAN_TITLE = 'Продукти';

describe('consolidation/refund-candidate-category-translation', () => {
    it('returns the localized default category title for the active language', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
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

        const englishCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.EN);
        const ukrainianCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.UK);

        expect(englishCandidates).toMatchObject([{ id: expense.id, categoryTitle: GROCERIES_TITLE }]);
        expect(ukrainianCandidates).toMatchObject([{ id: expense.id, categoryTitle: GROCERIES_UKRAINIAN_TITLE }]);
    });
});
