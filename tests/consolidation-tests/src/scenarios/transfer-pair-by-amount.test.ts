import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import {
    consolidationAutoCandidateService,
    consolidationCandidateService,
    testQueryService,
    testSeedService
} from '../harness/test-context';

describe('consolidation/transfer-pair-by-amount', () => {
    it('consolidates amount and transfer-MCC matches through consolidation services', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { expense, income } = testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const groups = await consolidationCandidateService.findGroups();
        expect(groups.pairCandidates).toHaveLength(1);

        const consolidated = await consolidationAutoCandidateService.processGroups(groups);
        expect(consolidated).toBe(1);

        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);
    });
});
