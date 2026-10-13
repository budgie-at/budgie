import { ConsolidationCandidateRepository, RefundPairRepository } from '@budgie/consolidation';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { afterEach, expect, layer, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTargetIncome,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { testQueryService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/family-priority', it => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('processes automatic consolidation families in the explicit priority order', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const refundPairRepository = yield* RefundPairRepository;
            const familyQueries = {
                IBAN_BRIDGE_CHAIN_TRANSFER: vi.spyOn(consolidationCandidateRepository, 'findIbanBridgeChainTransferCandidates'),
                EXISTING_TRANSFER_BRIDGE: vi.spyOn(consolidationCandidateRepository, 'findExistingTransferBridgeCandidates'),
                EXISTING_TRANSFER_CHAIN_RECLAIM: vi.spyOn(consolidationCandidateRepository, 'findExistingTransferChainReclaimCandidates'),
                IBAN_BRIDGE_CANONICAL_DUPLICATE: vi.spyOn(consolidationCandidateRepository, 'findIbanBridgeCanonicalDuplicateCandidates'),
                IBAN_BRIDGE_TRANSFER: vi.spyOn(consolidationCandidateRepository, 'findIbanBridgeTransferCandidates'),
                IBAN_BRIDGE_CANONICAL_SUPERSESSION: vi.spyOn(
                    consolidationCandidateRepository,
                    'findIbanBridgeCanonicalSupersessionCandidates'
                ),
                EXISTING_TRANSFER_INCOME_DUPLICATE: vi.spyOn(
                    consolidationCandidateRepository,
                    'findExistingTransferIncomeDuplicateCandidates'
                ),
                P2P_FIAT_TRANSFER: vi.spyOn(consolidationCandidateRepository, 'findP2pFiatAuthoritativeCandidates'),
                TRANSFER_PAIR: vi.spyOn(consolidationCandidateRepository, 'findTransferPairCandidates'),
                REFUND: vi.spyOn(refundPairRepository, 'findCandidates'),
                MANUAL_EXPENSE_DUPLICATE: vi.spyOn(consolidationCandidateRepository, 'findManualExpenseDuplicateCandidates')
            };

            yield* transferConsolidationService.consolidate(null);

            const queriedFamilyKeys = Object.entries(familyQueries)
                .flatMap(([familyKey, spy]) =>
                    spy.mock.invocationCallOrder.map(invocationCallOrder => ({
                        familyKey,
                        invocationCallOrder
                    }))
                )
                .toSorted((left, right) => left.invocationCallOrder - right.invocationCallOrder)
                .map(({ familyKey }) => familyKey);

            expect(queriedFamilyKeys).toEqual([
                'IBAN_BRIDGE_CHAIN_TRANSFER',
                'EXISTING_TRANSFER_BRIDGE',
                'EXISTING_TRANSFER_CHAIN_RECLAIM',
                'IBAN_BRIDGE_CANONICAL_DUPLICATE',
                'IBAN_BRIDGE_TRANSFER',
                'IBAN_BRIDGE_CANONICAL_SUPERSESSION',
                'EXISTING_TRANSFER_INCOME_DUPLICATE',
                'P2P_FIAT_TRANSFER',
                'TRANSFER_PAIR',
                'REFUND',
                'MANUAL_EXPENSE_DUPLICATE'
            ]);
        })
    );

    it.effect('lets the IBAN bridge chain family claim overlapping legs before the plain IBAN bridge family', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const topology = yield* seedIbanBridgeTopology();
            const legs = yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

            yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId);
            yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId);

            expect(yield* transferConsolidationService.consolidate(null)).toEqual({ consolidated: 1, found: 1 });

            const [chainCanonical] = yield* testQueryService.fetchCanonicalsOfType(
                TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER
            );

            expect((yield* testQueryService.fetchTransactionById(legs.bridgeIncome.id)).consolidationParentTransactionId).toBe(
                chainCanonical.id
            );
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(0);
        })
    );
});
