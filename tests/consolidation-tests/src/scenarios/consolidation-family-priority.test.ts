import { ConsolidationFamilyRegistryService, type ConsolidationFamilyStrategyInterface } from '@budgie/consolidation';
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

const expectStrategyContract = (family: ConsolidationFamilyStrategyInterface): void => {
    expect(typeof family.preview).toBe('function');
    expect(typeof family.process).toBe('function');
};

describe('consolidation/family-priority', () => {
    it('keeps automatic consolidation family priority explicit and stable', () => {
        const familyRegistry = new ConsolidationFamilyRegistryService(
            {
                atmCashWithdrawalRepository,
                existingTransferRepository,
                ibanBridgeTransferRepository,
                refundPairRepository,
                transferPairRepository
            },
            consolidationExecutorService,
            consolidationRepairExecutorService,
            () => Promise.resolve()
        );

        const families = familyRegistry.buildFamilies();
        const familyKeys = families.map(family => family.key);

        expect(familyKeys).toEqual([
            'IBAN_BRIDGE_CHAIN_TRANSFER',
            'EXISTING_TRANSFER_BRIDGE',
            'EXISTING_TRANSFER_CHAIN_RECLAIM',
            'IBAN_BRIDGE_CANONICAL_DUPLICATE',
            'IBAN_BRIDGE_TRANSFER',
            'EXISTING_TRANSFER_INCOME_DUPLICATE',
            'TRANSFER_PAIR',
            'ATM_CASH_WITHDRAWAL',
            'REFUND'
        ]);
        for (const family of families) {
            expectStrategyContract(family);
        }
    });
});
