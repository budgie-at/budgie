import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import {
    atmCashWithdrawalRepository,
    consolidationExecutorService,
    consolidationRepairExecutorService,
    existingTransferRepository,
    ibanBridgeTransferRepository,
    refundPairRepository,
    runEffect,
    transferPairRepository
} from '../harness/test-context';

describe('consolidation/p2p canonical repair sequencing', () => {
    it('runs canonical repairs one at a time and yields between them', async () => {
        const events: string[] = [];
        const repairs: number[] = [];
        const transferPairRepositoryWithRepairs = Object.assign(Object.create(transferPairRepository), {
            findP2pFiatAuthoritativeRepairCandidates: () => Effect.succeed([{ canonicalTransactionId: 1 }, { canonicalTransactionId: 2 }])
        });
        const repairExecutor = Object.assign(Object.create(consolidationRepairExecutorService), {
            repairP2pFiatCanonical: (canonicalTransactionId: number) =>
                Effect.gen(function* () {
                    repairs.push(canonicalTransactionId);
                    events.push(`start:${canonicalTransactionId}`);
                    yield* Effect.yieldNow;
                    events.push(`end:${canonicalTransactionId}`);
                })
        });
        const yieldControl = async () => {
            events.push('yield');
        };
        const coordinator = new ConsolidationCoordinatorService(
            {
                atmCashWithdrawalRepository,
                existingTransferRepository,
                ibanBridgeTransferRepository,
                refundPairRepository,
                transferPairRepository: transferPairRepositoryWithRepairs
            },
            consolidationExecutorService,
            repairExecutor,
            yieldControl
        );

        await runEffect(coordinator.consolidate());

        expect(repairs).toStrictEqual([1, 2]);
        expect(events.slice(events.indexOf('start:1'), events.indexOf('end:2') + 1)).toStrictEqual([
            'start:1',
            'end:1',
            'yield',
            'start:2',
            'end:2'
        ]);
    });
});
