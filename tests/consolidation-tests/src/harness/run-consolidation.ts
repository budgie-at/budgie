import { expect } from 'vitest';

import { consolidationCoordinatorService } from './test-context';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = async (
    scope: ConsolidationScanScopeInterface | null = null
): Promise<{
    readonly consolidated: number;
    readonly found: number;
}> => {
    const result = await consolidationCoordinatorService.consolidate(scope);

    return result;
};

export const expectSecondConsolidationRunStable = async (): Promise<void> => {
    const secondResult = await runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
};
