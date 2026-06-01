import { consolidationAutoCandidateService, consolidationCandidateService } from './test-context';

import type { ConsolidationCandidateGroupsInterface } from '@budgie/consolidation';

export const runConsolidation = async (): Promise<{
    readonly consolidated: number;
    readonly groups: ConsolidationCandidateGroupsInterface;
}> => {
    const groups = await consolidationCandidateService.findGroups();
    const consolidated = await consolidationAutoCandidateService.processGroups(groups);

    return { consolidated, groups };
};
