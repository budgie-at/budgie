import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import type { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import type { ConsolidationFamilyRunContextInterface } from '../interface/consolidation-family-run-context.interface';
import type { ConsolidationFamilyRunResultInterface } from '../interface/consolidation-family-run-result.interface';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationScanScopeInterface, Db, DbError } from '@budgie/contracts';

export abstract class ConsolidationFamilyStrategyService<Candidate> implements ConsolidationFamilyStrategyInterface {
    private static readonly YIELD_EVERY_CANDIDATES = 10;

    readonly preview = Effect.fn('ConsolidationFamilyStrategyService.preview')(function* (
        this: ConsolidationFamilyStrategyService<Candidate>,
        context: ConsolidationFamilyRunContextInterface
    ) {
        const candidates = yield* this.buildRunnableCandidates(context);

        return {
            blockedSourceTransactionIds: this.buildBlockedSourceTransactionIds(candidates),
            found: candidates.length
        };
    });

    readonly process = Effect.fn('ConsolidationFamilyStrategyService.process')(function* (
        this: ConsolidationFamilyStrategyService<Candidate>,
        context: ConsolidationFamilyRunContextInterface
    ) {
        yield* this.prepareProcess(context);

        const blockedSourceTransactionIds = new Set<number>();
        let consolidated = 0;
        let found = 0;
        let shouldContinue = true;

        while (shouldContinue) {
            const { consolidated: consolidatedInPass, found: foundAfterPass } = yield* this.processPass(
                context,
                blockedSourceTransactionIds,
                found
            );

            consolidated += consolidatedInPass;
            found = foundAfterPass;
            shouldContinue = this.shouldRepeatAfterSuccessfulPass() && consolidatedInPass > 0;
        }

        return {
            blockedSourceTransactionIds: [...blockedSourceTransactionIds],
            consolidated,
            found
        } satisfies ConsolidationFamilyRunResultInterface;
    });

    readonly processCandidateList = Effect.fn('ConsolidationFamilyStrategyService.processCandidateList')(function* (
        this: ConsolidationFamilyStrategyService<Candidate>,
        candidates: Candidate[]
    ) {
        let consolidated = 0;

        for (const [candidateIndex, candidate] of candidates.entries()) {
            if (yield* this.consolidateCandidate(candidate)) {
                consolidated += 1;
            }

            yield* this.yieldBetweenCandidates(candidateIndex, candidates.length);
        }

        return consolidated;
    });

    private readonly buildRunnableCandidates = Effect.fnUntraced(function* (
        this: ConsolidationFamilyStrategyService<Candidate>,
        context: ConsolidationFamilyRunContextInterface
    ) {
        const candidates = yield* this.findCandidates(context.scope);
        yield* this.yieldNow();
        const runnableCandidates = candidates.filter(candidate => this.isCandidateRunnable(candidate, context));
        yield* this.yieldNow();

        return runnableCandidates;
    });

    private readonly processPass = Effect.fnUntraced(function* (
        this: ConsolidationFamilyStrategyService<Candidate>,
        context: ConsolidationFamilyRunContextInterface,
        blockedSourceTransactionIds: Set<number>,
        foundBefore: number
    ) {
        const candidates = yield* this.buildRunnableCandidates(context);
        const found = foundBefore + candidates.length;

        for (const sourceTransactionId of this.buildBlockedSourceTransactionIds(candidates)) {
            blockedSourceTransactionIds.add(sourceTransactionId);
        }

        const consolidated = yield* this.processCandidateList(candidates);

        context.onProgress?.(found);
        yield* this.yieldNow();

        return { consolidated, found };
    });

    private readonly yieldBetweenCandidates = Effect.fnUntraced(function* (
        this: ConsolidationFamilyStrategyService<Candidate>,
        candidateIndex: number,
        candidateCount: number
    ) {
        const processedCandidateCount = candidateIndex + 1;
        const hasMoreCandidates = processedCandidateCount < candidateCount;

        if (hasMoreCandidates && processedCandidateCount % ConsolidationFamilyStrategyService.YIELD_EVERY_CANDIDATES === 0) {
            yield* this.yieldNow();
        }
    });

    abstract readonly key: ConsolidationFamilyKeyEnum;

    constructor(private readonly yieldControl: () => Promise<void>) {}

    protected shouldRepeatAfterSuccessfulPass(): boolean {
        return false;
    }

    protected readonly prepareProcess: (context: ConsolidationFamilyRunContextInterface) => Effect.Effect<void, DbError, Db> = () =>
        Effect.void;

    protected getScopeTransactionIds(candidate: Candidate): number[] {
        return this.getSourceTransactionIds(candidate);
    }

    private yieldNow(): Effect.Effect<void> {
        return Effect.promise(() => this.yieldControl());
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

        return this.getScopeTransactionIds(candidate).some(scopeTransactionId => scope.transactionIds.includes(scopeTransactionId));
    }

    private buildBlockedSourceTransactionIds(candidates: Candidate[]): number[] {
        return candidates.flatMap(candidate => this.getSourceTransactionIds(candidate));
    }

    protected abstract findCandidates(scope: ConsolidationScanScopeInterface | null): Effect.Effect<Candidate[], DbError, Db>;

    protected abstract consolidateCandidate(candidate: Candidate): Effect.Effect<boolean, DbError, Db>;

    protected abstract getSourceTransactionIds(candidate: Candidate): number[];
}
