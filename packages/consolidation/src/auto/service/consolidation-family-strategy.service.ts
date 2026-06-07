import type { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import type { ConsolidationFamilyPreviewInterface } from '../interface/consolidation-family-preview.interface';
import type { ConsolidationFamilyRunContextInterface } from '../interface/consolidation-family-run-context.interface';
import type { ConsolidationFamilyRunResultInterface } from '../interface/consolidation-family-run-result.interface';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export abstract class ConsolidationFamilyStrategyService<Candidate> implements ConsolidationFamilyStrategyInterface {
    private static readonly YIELD_EVERY_CANDIDATES = 10;

    abstract readonly key: ConsolidationFamilyKeyEnum;

    constructor(private readonly yieldControl: () => Promise<void>) {}

    async preview(context: ConsolidationFamilyRunContextInterface): Promise<ConsolidationFamilyPreviewInterface> {
        const candidates = await this.buildRunnableCandidates(context);

        return {
            blockedSourceTransactionIds: this.buildBlockedSourceTransactionIds(candidates),
            found: candidates.length
        };
    }

    async process(context: ConsolidationFamilyRunContextInterface): Promise<ConsolidationFamilyRunResultInterface> {
        const candidates = await this.buildRunnableCandidates(context);
        const consolidated = await this.processCandidateList(candidates);
        context.onProgress?.(candidates.length);
        await this.yieldControl();

        return {
            blockedSourceTransactionIds: this.buildBlockedSourceTransactionIds(candidates),
            consolidated,
            found: candidates.length
        };
    }

    async processCandidateList(candidates: Candidate[]): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate, candidateIndex) => {
            const consolidated = await consolidatedPromise;
            const success = await this.consolidateCandidate(candidate).then(
                result => result,
                () => false
            );
            await this.yieldBetweenCandidates(candidateIndex, candidates.length);

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }

    private async buildRunnableCandidates(context: ConsolidationFamilyRunContextInterface): Promise<Candidate[]> {
        const candidates = await this.findCandidates(context.scope);
        await this.yieldControl();
        const runnableCandidates = candidates.filter(candidate => this.isCandidateRunnable(candidate, context.blockedSourceTransactionIds));
        await this.yieldControl();

        return runnableCandidates;
    }

    private isCandidateRunnable(candidate: Candidate, blockedSourceTransactionIds: ReadonlySet<number>): boolean {
        return this.getSourceTransactionIds(candidate).every(sourceTransactionId => !blockedSourceTransactionIds.has(sourceTransactionId));
    }

    private buildBlockedSourceTransactionIds(candidates: Candidate[]): number[] {
        return candidates.flatMap(candidate => this.getSourceTransactionIds(candidate));
    }

    private async yieldBetweenCandidates(candidateIndex: number, candidateCount: number): Promise<void> {
        const processedCandidateCount = candidateIndex + 1;
        const hasMoreCandidates = processedCandidateCount < candidateCount;

        if (hasMoreCandidates && processedCandidateCount % ConsolidationFamilyStrategyService.YIELD_EVERY_CANDIDATES === 0) {
            await this.yieldControl();
        }
    }

    protected abstract findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<Candidate[]>;

    protected abstract consolidateCandidate(candidate: Candidate): Promise<boolean>;

    protected abstract getSourceTransactionIds(candidate: Candidate): number[];
}
