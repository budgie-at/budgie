import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';

import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/yielding', it => {
    it.effect('yields while processing automatic candidate families', () =>
        Effect.gen(function* () {
            const transferMcc = testQueryService.findMccByCode('4829');
            testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

            let sleepCount = 0;
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;

            const result = yield* Clock.clockWith(clock =>
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
            );

            expect(result.consolidated).toBe(1);
            expect(sleepCount).toBeGreaterThan(1);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
        })
    );
});
