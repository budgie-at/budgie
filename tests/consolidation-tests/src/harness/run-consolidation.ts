import { expect } from 'vitest';

import { consolidationAutoCandidateService, runEffect } from './test-context';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = (
    scope: ConsolidationScanScopeInterface | null = null
): Promise<{
    readonly consolidated: number;
    readonly found: number;
}> => runEffect(consolidationAutoCandidateService.process(scope));

export const expectSecondConsolidationRunStable = async (): Promise<void> => {
    const secondResult = await runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
};
