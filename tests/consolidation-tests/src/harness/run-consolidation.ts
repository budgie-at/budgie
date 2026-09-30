import { expect } from 'vitest';

import { consolidationCoordinatorService, runEffect } from './test-context';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = (
    scope: ConsolidationScanScopeInterface | null = null
): Promise<{
    readonly consolidated: number;
    readonly found: number;
}> => runEffect(consolidationCoordinatorService.consolidate(scope));

export const expectSecondConsolidationRunStable = async (): Promise<void> => {
    const secondResult = await runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
};
