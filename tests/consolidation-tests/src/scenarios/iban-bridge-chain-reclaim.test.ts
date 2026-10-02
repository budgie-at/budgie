import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    CHAIN_RECLAIM_ONE_CENT_AMOUNT,
    expectAbsorbedIntoExistingTransfer,
    seedChainReclaimFixture,
    seedNestedChainReclaimFixture
} from '../harness/chain-reclaim-fixture';
import { expectConsolidationParent, expectSourcesRestored, fetchMovedSourceIds } from '../harness/consolidation-revert-audit';
import { expectConsolidationResult } from '../harness/expect-consolidation-result';
import { IBAN_BRIDGE_EUR_AMOUNT } from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, TestLayer } from '../harness/test-context';

const byTransactionId = (left: number, right: number): number => left - right;

layer(TestLayer)('consolidation/iban-bridge-chain-reclaim', it => {
    it.effect('reclaims late bridge legs into an existing generated transfer pair', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR
            });

            yield* expectConsolidationResult({ found: 1, consolidated: 1 });
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
            expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
            expect(fetchMovedSourceIds(directTransfer.id)).toEqual([bridgeIncome.id, bridgeExpense.id].sort(byTransactionId));
        })
    );

    it.effect('preserves original moved source rows when reclaiming bridge legs into an existing generated transfer pair', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer, sourceExpense, targetIncome } = seedNestedChainReclaimFixture();

            yield* expectConsolidationResult({ found: 1, consolidated: 1 });
            expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
            expectConsolidationParent(sourceExpense.id, directTransfer.id);
            expectConsolidationParent(targetIncome.id, directTransfer.id);
            expect(fetchMovedSourceIds(directTransfer.id)).toEqual(
                [sourceExpense.id, targetIncome.id, bridgeIncome.id, bridgeExpense.id].sort(byTransactionId)
            );
        })
    );

    it.effect('does not reclaim or duplicate bridge legs when the direct transfer is source-less', () =>
        Effect.gen(function* () {
            const { bridgeIncome, bridgeExpense, directTransfer } = seedChainReclaimFixture({ consolidationType: null });

            yield* expectConsolidationResult({ found: 0, consolidated: 0 });
            expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBeNull();
            expectSourcesRestored([bridgeIncome.id, bridgeExpense.id]);
        })
    );

    it.effect('reclaims an off-by-cents chain instead of creating a duplicate bridge canonical', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                directSourceAmount: IBAN_BRIDGE_EUR_AMOUNT + CHAIN_RECLAIM_ONE_CENT_AMOUNT
            });

            yield* expectConsolidationResult({ found: 1, consolidated: 1 });
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(0);
            expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
        })
    );

    it.effect('leaves an already reclaimed chain untouched on a repeated consolidation run', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                directSourceAmount: IBAN_BRIDGE_EUR_AMOUNT + CHAIN_RECLAIM_ONE_CENT_AMOUNT
            });

            yield* runConsolidation();
            const repeatedResult = yield* runConsolidation();

            expect(repeatedResult.found).toBe(0);
            expect(repeatedResult.consolidated).toBe(0);
            expectAbsorbedIntoExistingTransfer(directTransfer.id, bridgeIncome.id, bridgeExpense.id);
        })
    );
});
