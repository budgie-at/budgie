import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { CONSOLIDATION_YIELD } from '../../shared/constant/consolidation-yield.constant';

import type { ConsolidationFamilyDefinitionInterface } from '../interface/consolidation-family-definition.interface';
import type { ConsolidationFamilyRunContextInterface } from '../interface/consolidation-family-run-context.interface';
import type { ConsolidationFamilyRunResultInterface } from '../interface/consolidation-family-run-result.interface';

export const makeConsolidationFamilyStrategy = <Candidate>(definition: ConsolidationFamilyDefinitionInterface<Candidate>) => {
    const yieldEveryCandidates = 10;
    const getScopeTransactionIds = definition.getScopeTransactionIds ?? definition.getSourceTransactionIds;
    const prepareProcess = definition.prepareProcess ?? (() => Effect.void);

    const isCandidateRunnable = (
        candidate: Candidate,
        { blockedSourceTransactionIds, scope }: ConsolidationFamilyRunContextInterface
    ): boolean =>
        (!isDefined(scope) ||
            getScopeTransactionIds(candidate).some(scopeTransactionId => scope.transactionIds.includes(scopeTransactionId))) &&
        definition.getSourceTransactionIds(candidate).every(sourceTransactionId => !blockedSourceTransactionIds.has(sourceTransactionId));

    const buildBlockedSourceTransactionIds = (candidates: Candidate[]): number[] =>
        candidates.flatMap(candidate => definition.getSourceTransactionIds(candidate));

    const buildRunnableCandidates = Effect.fnUntraced(function* (context: ConsolidationFamilyRunContextInterface) {
        const candidates = yield* definition.findCandidates(context.scope);
        yield* CONSOLIDATION_YIELD;
        const runnableCandidates = candidates.filter(candidate => isCandidateRunnable(candidate, context));
        yield* CONSOLIDATION_YIELD;

        return runnableCandidates;
    });

    const yieldBetweenCandidates = Effect.fnUntraced(function* (candidateIndex: number, candidateCount: number) {
        const processedCandidateCount = candidateIndex + 1;

        if (processedCandidateCount < candidateCount && processedCandidateCount % yieldEveryCandidates === 0) {
            yield* CONSOLIDATION_YIELD;
        }
    });

    const processCandidateList = Effect.fn('ConsolidationFamilyStrategyService.processCandidateList')(function* (candidates: Candidate[]) {
        let consolidated = 0;

        for (const [candidateIndex, candidate] of candidates.entries()) {
            if (yield* definition.consolidateCandidate(candidate)) {
                consolidated += 1;
            }

            yield* yieldBetweenCandidates(candidateIndex, candidates.length);
        }

        return consolidated;
    });

    const processPass = Effect.fnUntraced(function* (
        context: ConsolidationFamilyRunContextInterface,
        blockedSourceTransactionIds: Set<number>,
        foundBefore: number
    ) {
        const candidates = yield* buildRunnableCandidates(context);
        const found = foundBefore + candidates.length;

        for (const sourceTransactionId of buildBlockedSourceTransactionIds(candidates)) {
            blockedSourceTransactionIds.add(sourceTransactionId);
        }

        const consolidated = yield* processCandidateList(candidates);

        context.onProgress?.(found);
        yield* CONSOLIDATION_YIELD;

        return { consolidated, found };
    });

    return {
        key: definition.key,
        preview: Effect.fn('ConsolidationFamilyStrategyService.preview')(function* (context: ConsolidationFamilyRunContextInterface) {
            const candidates = yield* buildRunnableCandidates(context);

            return {
                blockedSourceTransactionIds: buildBlockedSourceTransactionIds(candidates),
                found: candidates.length
            };
        }),
        process: Effect.fn('ConsolidationFamilyStrategyService.process')(function* (context: ConsolidationFamilyRunContextInterface) {
            yield* prepareProcess(context);

            const blockedSourceTransactionIds = new Set<number>();
            let consolidated = 0;
            let found = 0;
            let shouldContinue = true;

            while (shouldContinue) {
                const { consolidated: consolidatedInPass, found: foundAfterPass } = yield* processPass(
                    context,
                    blockedSourceTransactionIds,
                    found
                );

                consolidated += consolidatedInPass;
                found = foundAfterPass;
                shouldContinue = definition.shouldRepeatAfterSuccessfulPass === true && consolidatedInPass > 0;
            }

            return {
                blockedSourceTransactionIds: [...blockedSourceTransactionIds],
                consolidated,
                found
            } satisfies ConsolidationFamilyRunResultInterface;
        }),
        processCandidateList
    };
};
