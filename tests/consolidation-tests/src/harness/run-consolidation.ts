import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const rebuildStoredBalances = () =>
    Effect.flatMap(AccountBalanceIncrementalService, accountBalanceIncrementalService =>
        accountBalanceIncrementalService.updateAllBalances(false)
    );

export const runConsolidation = Effect.fn('runConsolidation')(function* (scope: ConsolidationScanScopeInterface | null = null) {
    const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;

    yield* rebuildStoredBalances();

    const result = yield* consolidationCoordinatorService.consolidate(scope);

    yield* rebuildStoredBalances();

    return result;
});

export const expectSecondConsolidationRunStable = Effect.fnUntraced(function* () {
    const secondResult = yield* runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
});
