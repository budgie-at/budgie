import { describe, expect, it } from 'vitest';

import {
    ConsolidationFamilyBatchBuilderService,
    ConsolidationFamilyKeyEnum,
    type ConsolidationCandidateGroupsInterface
} from '@budgie/consolidation';

import { consolidationExecutorService } from '../harness/test-context';

const emptyCandidateGroups = {
    atmCashWithdrawalCandidates: [],
    atmCashWithdrawalReviewCandidates: [],
    existingTransferBridgeCandidates: [],
    existingTransferChainReclaimCandidates: [],
    existingTransferIncomeDuplicateCandidates: [],
    ibanBridgeCanonicalDuplicateCandidates: [],
    ibanBridgeChainTransferCandidates: [],
    ibanBridgeTransferCandidates: [],
    manualReviewCandidates: [],
    pairCandidates: [],
    refundCandidates: [],
    refundReviewCandidates: []
} satisfies ConsolidationCandidateGroupsInterface;

describe('consolidation/family-priority', () => {
    it('keeps automatic consolidation family priority explicit and stable', () => {
        const familyBatchBuilder = new ConsolidationFamilyBatchBuilderService(consolidationExecutorService, () => Promise.resolve(0));

        const familyKeys = familyBatchBuilder.buildBatches(emptyCandidateGroups).map(batch => batch.key);

        expect(familyKeys).toEqual([
            ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_BRIDGE,
            ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_CHAIN_RECLAIM,
            ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE,
            ConsolidationFamilyKeyEnum.IBAN_BRIDGE_TRANSFER,
            ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_INCOME_DUPLICATE,
            ConsolidationFamilyKeyEnum.TRANSFER_PAIR,
            ConsolidationFamilyKeyEnum.ATM_CASH_WITHDRAWAL,
            ConsolidationFamilyKeyEnum.REFUND
        ]);
    });
});
