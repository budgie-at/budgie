import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import { TransferConsolidationService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { seedStoredBalancesOnce, testDb } from './test-context';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = (scope: ConsolidationScanScopeInterface | null = null) =>
    seedStoredBalancesOnce.pipe(
        Effect.andThen(TransferConsolidationService),
        Effect.flatMap(transferConsolidationService => transferConsolidationService.consolidate(scope)),
        Effect.tap(() => assertStoredBalancesMatchLedger(testDb))
    );

export const expectSecondConsolidationRunStable = Effect.fnUntraced(function* () {
    const secondResult = yield* runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
});
