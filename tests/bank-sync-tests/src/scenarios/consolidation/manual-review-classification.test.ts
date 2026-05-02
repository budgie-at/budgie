import { describe, expect, it } from 'vitest';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, findMccByCode, seedAccountPair, seedBankPair } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const PRECISION = 1_000_000;
const SLOW_WINDOW_OFFSET_SECONDS = 30 * 60;

describe('consolidation/manual-review-classification', () => {
    it('classifies a slow-window same-currency pair as manual review (no auto-consolidation)', async () => {
        const { fromAccount, toAccount } = seedAccountPair();
        const transferMcc = findMccByCode('4829');

        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const slow = new Date(operatedAt.getTime() + SLOW_WINDOW_OFFSET_SECONDS * 1000);

        seedBankPair.expense(
            { externalId: 'tx-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );
        seedBankPair.income(
            { externalId: 'tx-income', operatedAt: slow },
            { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );

        const consolidateResult = await transferConsolidationService.consolidate();
        expect(consolidateResult.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);

        const previewResult = await transferConsolidationService.preview();
        expect(previewResult.autoCandidateCount).toBe(0);
        expect(previewResult.manualReviewCandidateCount).toBeGreaterThanOrEqual(1);
    });
});
