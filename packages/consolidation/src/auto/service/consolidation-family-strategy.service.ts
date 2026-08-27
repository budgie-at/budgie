import { isDefined } from '@rnw-community/shared';

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
        const blockedSourceTransactionIds = new Set<number>();

        return this.processPass(context, blockedSourceTransactionIds, 0, 0);
    }

    async processCandidateList(candidates: Candidate[]): Promise<number> {
        let consolidatedPromise = Promise.resolve(0);

        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
            const candidate = candidates[candidateIndex];

            consolidatedPromise = consolidatedPromise.then(async consolidated => {
                const success = await this.consolidateCandidate(candidate);
                await this.yieldBetweenCandidates(candidateIndex, candidates.length);

                return success ? consolidated + 1 : consolidated;
            });
        }

        return consolidatedPromise;
    }

    protected shouldRepeatAfterSuccessfulPass(): boolean {
        return false;
    }

    private async buildRunnableCandidates(context: ConsolidationFamilyRunContextInterface): Promise<Candidate[]> {
        const candidates = await this.findCandidates(context.scope);
        await this.yieldControl();
        const runnableCandidates = candidates.filter(candidate => this.isCandidateRunnable(candidate, context));
        await this.yieldControl();

        return runnableCandidates;
    }

    private async processPass(
        context: ConsolidationFamilyRunContextInterface,
        blockedSourceTransactionIds: Set<number>,
        consolidated: number,
        found: number
    ): Promise<ConsolidationFamilyRunResultInterface> {
        const candidates = await this.buildRunnableCandidates(context);
        const nextFound = found + candidates.length;

        this.buildBlockedSourceTransactionIds(candidates).forEach(sourceTransactionId =>
            blockedSourceTransactionIds.add(sourceTransactionId)
        );

        const consolidatedInPass = await this.processCandidateList(candidates);

        context.onProgress?.(nextFound);
        await this.yieldControl();

        if (this.shouldRepeatAfterSuccessfulPass() && consolidatedInPass > 0) {
            return this.processPass(context, blockedSourceTransactionIds, consolidated + consolidatedInPass, nextFound);
        }

        return {
            blockedSourceTransactionIds: [...blockedSourceTransactionIds],
            consolidated: consolidated + consolidatedInPass,
            found: nextFound
        };
    }

    private isCandidateRunnable(candidate: Candidate, context: ConsolidationFamilyRunContextInterface): boolean {
        return (
            this.isCandidateInScope(candidate, context.scope) &&
            this.getSourceTransactionIds(candidate).every(
                sourceTransactionId => !context.blockedSourceTransactionIds.has(sourceTransactionId)
            )
        );
    }

    private isCandidateInScope(candidate: Candidate, scope: ConsolidationScanScopeInterface | null): boolean {
        if (!isDefined(scope)) {
            return true;
        }

        return this.getSourceTransactionIds(candidate).some(sourceTransactionId => scope.transactionIds.includes(sourceTransactionId));
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
