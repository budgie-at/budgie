import { describe, expect, it } from 'vitest';

import {
    ConsolidationFamilyRegistryService,
    ConsolidationFamilyKeyEnum,
    type ConsolidationFamilyStrategyInterface
} from '@budgie/consolidation';

import {
    atmCashWithdrawalRepository,
    consolidationExecutorService,
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
            () => Promise.resolve()
        );

        const families = familyRegistry.buildFamilies();
        const familyKeys = families.map(family => family.key);

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
        for (const family of families) {
            expectStrategyContract(family);
        }
    });
});
