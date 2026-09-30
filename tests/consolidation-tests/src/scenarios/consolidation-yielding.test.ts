import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
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
    testQueryService,
    testSeedService,
    transferPairRepository
} from '../harness/test-context';

describe('consolidation/yielding', () => {
    it('yields while processing automatic candidate families', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        let sleepCount = 0;
        const consolidationCoordinatorService = new ConsolidationCoordinatorService(
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

        const result = await runEffect(
            Clock.clockWith(clock =>
                consolidationCoordinatorService.consolidate().pipe(
                    Effect.provideService(
                        Clock.Clock,
                        Object.assign(Object.create(clock), {
                            sleep: () => {
                                sleepCount += 1;

                                return Effect.void;
                            }
                        })
                    )
                )
            )
        );

        expect(result.consolidated).toBe(1);
        expect(sleepCount).toBeGreaterThan(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
