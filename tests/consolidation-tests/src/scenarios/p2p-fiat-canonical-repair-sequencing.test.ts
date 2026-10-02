import { ConsolidationCoordinatorService, ConsolidationRepairExecutorService, TransferPairRepository } from '@budgie/consolidation';
import { afterEach, expect, layer, vi } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/p2p canonical repair sequencing', it => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('runs canonical repairs one at a time and yields between them', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;
            const transferPairRepository = yield* TransferPairRepository;
            const events: string[] = [];
            const repairs: number[] = [];

            vi.spyOn(transferPairRepository, 'findP2pFiatAuthoritativeRepairCandidates').mockReturnValue(
                Effect.succeed([{ canonicalTransactionId: 1 }, { canonicalTransactionId: 2 }])
            );
            vi.spyOn(consolidationRepairExecutorService, 'repairP2pFiatCanonical').mockImplementation(canonicalTransactionId =>
                Effect.gen(function* () {
                    repairs.push(canonicalTransactionId);
                    events.push(`start:${canonicalTransactionId}`);
                    yield* Effect.yieldNow;
                    events.push(`end:${canonicalTransactionId}`);

                    return true;
                })
            );

            yield* Clock.clockWith(clock =>
                consolidationCoordinatorService.consolidate().pipe(
                    Effect.provideService(
                        Clock.Clock,
                        Object.assign(Object.create(clock), {
                            sleep: () => {
                                events.push('yield');

                                return Effect.void;
                            }
                        })
                    )
                )
            );

            expect(repairs).toStrictEqual([1, 2]);
            expect(events.slice(events.indexOf('start:1'), events.indexOf('end:2') + 1)).toStrictEqual([
                'start:1',
                'end:1',
                'yield',
                'start:2',
                'end:2'
            ]);
        })
    );
});
