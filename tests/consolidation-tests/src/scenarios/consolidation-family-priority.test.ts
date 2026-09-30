import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { describe, expect, it } from 'vitest';

import {
    atmCashWithdrawalRepository,
    consolidationExecutorService,
    consolidationRepairExecutorService,
    existingTransferRepository,
    ibanBridgeTransferRepository,
    refundPairRepository,
    transferPairRepository
} from '../harness/test-context';

describe('consolidation/family-priority', () => {
    it('keeps automatic consolidation family priority explicit and stable', () => {
        const familyRegistry = new ConsolidationCoordinatorService(
            {
                atmCashWithdrawalRepository,
                existingTransferRepository,
                ibanBridgeTransferRepository,
                refundPairRepository,
                transferPairRepository
            },
            consolidationExecutorService,
            consolidationRepairExecutorService
        );

        const families = familyRegistry.families;
        const familyKeys = families.map(family => family.key);

        expect(familyKeys).toEqual([
            'IBAN_BRIDGE_CHAIN_TRANSFER',
            'EXISTING_TRANSFER_BRIDGE',
            'EXISTING_TRANSFER_CHAIN_RECLAIM',
            'IBAN_BRIDGE_CANONICAL_DUPLICATE',
            'IBAN_BRIDGE_TRANSFER',
            'IBAN_BRIDGE_CANONICAL_SUPERSESSION',
            'EXISTING_TRANSFER_INCOME_DUPLICATE',
            'P2P_FIAT_TRANSFER',
            'TRANSFER_PAIR',
            'REFUND'
        ]);
        for (const family of families) {
            expect(typeof family.preview).toBe('function');
            expect(typeof family.process).toBe('function');
        }
    });
});
