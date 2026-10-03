import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/idempotence', it => {
    it.effect('creates one canonical transfer when consolidation is run twice', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            yield* testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

            const firstResult = yield* runConsolidation();
            const secondResult = yield* runConsolidation();

            expect(firstResult.consolidated).toBe(1);
            expect(secondResult.consolidated).toBe(0);
            expect(secondResult.found).toBe(0);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
        })
    );
});
