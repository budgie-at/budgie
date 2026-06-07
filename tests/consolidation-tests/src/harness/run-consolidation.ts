import { consolidationAutoCandidateService } from './test-context';

export const runConsolidation = async (): Promise<{
    readonly consolidated: number;
    readonly found: number;
}> => {
    const result = await consolidationAutoCandidateService.process();

    return result;
};
