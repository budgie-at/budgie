import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_ONE_CENT_AMOUNT,
    expectAbsorbedIntoExistingTransfer,
    seedChainReclaimFixture,
    seedNestedChainReclaimFixture
} from '../harness/chain-reclaim-fixture';
import { expectConsolidationParent, expectSourcesRestored, fetchMovedSourceIds } from '../harness/consolidation-revert-audit';
import { IBAN_BRIDGE_EUR_AMOUNT } from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService } from '../harness/test-context';

const byTransactionId = (left: number, right: number): number => left - right;

describe('consolidation/iban-bridge-chain-reclaim', () => {
    it('reclaims late bridge legs into an existing generated transfer pair', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR
        });

        const result = await runConsolidation();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
        expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
        expect(fetchMovedSourceIds(directTransfer.id)).toEqual([bridgeIncome.id, bridgeExpense.id].sort(byTransactionId));
    });

    it('preserves original moved source rows when reclaiming bridge legs into an existing generated transfer pair', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceExpense, targetIncome } = await seedNestedChainReclaimFixture();

        const result = await runConsolidation();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
        expectConsolidationParent(sourceExpense.id, directTransfer.id);
        expectConsolidationParent(targetIncome.id, directTransfer.id);
        expect(fetchMovedSourceIds(directTransfer.id)).toEqual(
            [sourceExpense.id, targetIncome.id, bridgeIncome.id, bridgeExpense.id].sort(byTransactionId)
        );
    });

    it('does not reclaim or duplicate bridge legs when the direct transfer is source-less', async () => {
        const { bridgeIncome, bridgeExpense, directTransfer } = seedChainReclaimFixture({ consolidationType: null });

        const result = await runConsolidation();

        expect(result.found).toBe(0);
        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBeNull();
        expectSourcesRestored([bridgeIncome.id, bridgeExpense.id]);
    });

    it('reclaims an off-by-cents chain instead of creating a duplicate bridge canonical', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            directSourceAmount: IBAN_BRIDGE_EUR_AMOUNT + CHAIN_RECLAIM_ONE_CENT_AMOUNT
        });

        const result = await runConsolidation();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(0);
        expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
    });

    it('leaves an already reclaimed chain untouched on a repeated consolidation run', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            directSourceAmount: IBAN_BRIDGE_EUR_AMOUNT + CHAIN_RECLAIM_ONE_CENT_AMOUNT
        });

        await runConsolidation();
        const repeatedResult = await runConsolidation();

        expect(repeatedResult.found).toBe(0);
        expect(repeatedResult.consolidated).toBe(0);
        expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
    });
});
