import { consolidationAutoCandidateService } from './test-context';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = async (
    scope: ConsolidationScanScopeInterface | null = null
): Promise<{
    readonly consolidated: number;
    readonly found: number;
}> => {
    const result = await consolidationAutoCandidateService.process(scope);

    return result;
};
