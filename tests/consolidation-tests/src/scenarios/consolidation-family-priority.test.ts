import {
    ConsolidationCoordinatorService,
    ExistingTransferRepository,
    IbanBridgeTransferRepository,
    RefundPairRepository,
    TransferPairRepository
} from '@budgie/consolidation';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
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
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const existingTransferRepository = yield* ExistingTransferRepository;
            const ibanBridgeTransferRepository = yield* IbanBridgeTransferRepository;
            const refundPairRepository = yield* RefundPairRepository;
            const transferPairRepository = yield* TransferPairRepository;
            const familyQueries = {
                IBAN_BRIDGE_CHAIN_TRANSFER: vi.spyOn(ibanBridgeTransferRepository, 'findChainTransferCandidates'),
                EXISTING_TRANSFER_BRIDGE: vi.spyOn(existingTransferRepository, 'findBridgeCandidates'),
                EXISTING_TRANSFER_CHAIN_RECLAIM: vi.spyOn(existingTransferRepository, 'findChainReclaimCandidates'),
                IBAN_BRIDGE_CANONICAL_DUPLICATE: vi.spyOn(ibanBridgeTransferRepository, 'findCanonicalDuplicateCandidates'),
                IBAN_BRIDGE_TRANSFER: vi.spyOn(ibanBridgeTransferRepository, 'findTransferCandidates'),
                IBAN_BRIDGE_CANONICAL_SUPERSESSION: vi.spyOn(ibanBridgeTransferRepository, 'findCanonicalSupersessionCandidates'),
                EXISTING_TRANSFER_INCOME_DUPLICATE: vi.spyOn(existingTransferRepository, 'findIncomeDuplicateCandidates'),
                P2P_FIAT_TRANSFER: vi.spyOn(transferPairRepository, 'findP2pFiatAuthoritativeCandidates'),
                TRANSFER_PAIR: vi.spyOn(transferPairRepository, 'findCandidates'),
                REFUND: vi.spyOn(refundPairRepository, 'findCandidates')
            };

            yield* consolidationCoordinatorService.consolidate();

            const queriedFamilyKeys = Object.entries(familyQueries)
                .toSorted(([, left], [, right]) => left.mock.invocationCallOrder[0] - right.mock.invocationCallOrder[0])
                .map(([familyKey]) => familyKey);

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
                'REFUND'
            ]);
        })
    );

    it.effect('lets the IBAN bridge chain family claim overlapping legs before the plain IBAN bridge family', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const topology = yield* seedIbanBridgeTopology();
            const legs = yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

            yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId);
            yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId);

            expect(yield* consolidationCoordinatorService.consolidate()).toEqual({ consolidated: 1, found: 1 });

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
