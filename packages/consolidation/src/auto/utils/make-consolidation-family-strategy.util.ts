import { Db, YIELD_TO_UI } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { ConsolidationFamilyDefinitionInterface } from '../interface/consolidation-family-definition.interface';
import type { ConsolidationFamilyPrepareResultInterface } from '../interface/consolidation-family-prepare-result.interface';
import type { ConsolidationFamilyRunContextInterface } from '../interface/consolidation-family-run-context.interface';
import type { ConsolidationFamilyRunResultInterface } from '../interface/consolidation-family-run-result.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const TRANSACTION_BATCH_SIZE = 25;
const EMPTY_PREPARE_RESULT: ConsolidationFamilyPrepareResultInterface = {
    repairedCount: 0,
    releasedTransactionIds: []
};

export const makeConsolidationFamilyStrategy = <Candidate>(definition: ConsolidationFamilyDefinitionInterface<Candidate>) => {
    const getScopeTransactionIds = definition.getScopeTransactionIds ?? definition.getSourceTransactionIds;
    const prepareProcess = definition.prepareProcess ?? (() => Effect.succeed(EMPTY_PREPARE_RESULT));

    const getCandidateKey = (candidate: Candidate): string => definition.getSourceTransactionIds(candidate).join(',');

    const isCandidateRunnable = (
        candidate: Candidate,
        blockedSourceTransactionIds: ReadonlySet<number>,
        scopeTransactionIds: ReadonlySet<number> | null,
        failedCandidateKeys: ReadonlySet<string>
    ): boolean =>
        (!isDefined(scopeTransactionIds) ||
            getScopeTransactionIds(candidate).some(scopeTransactionId => scopeTransactionIds.has(scopeTransactionId))) &&
        !failedCandidateKeys.has(getCandidateKey(candidate)) &&
        definition.getSourceTransactionIds(candidate).every(sourceTransactionId => !blockedSourceTransactionIds.has(sourceTransactionId));

    const buildBlockedSourceTransactionIds = (candidates: readonly Candidate[]): number[] =>
        candidates.flatMap(candidate => definition.getSourceTransactionIds(candidate));

    const buildRunnableCandidates = Effect.fnUntraced(function* (
        scope: ConsolidationScanScopeInterface | null,
        blockedSourceTransactionIds: ReadonlySet<number>,
        failedCandidateKeys: ReadonlySet<string>
    ) {
        const candidates = yield* definition.findCandidates(scope);

        if (!isNotEmptyArray(candidates)) {
            return [];
        }

        const scopeTransactionIds = isDefined(scope) ? new Set(scope.transactionIds) : null;
        const runnableCandidates = candidates.filter(candidate =>
            isCandidateRunnable(candidate, blockedSourceTransactionIds, scopeTransactionIds, failedCandidateKeys)
        );

        if (isNotEmptyArray(runnableCandidates)) {
            yield* YIELD_TO_UI;
        }

        return runnableCandidates;
    });

    const processChunk = Effect.fnUntraced(
        function* (chunk: readonly Candidate[], succeededCandidates: Candidate[], failedCandidates: Candidate[]) {
            let consolidated = 0;

            for (const candidate of chunk) {
                if (yield* definition.consolidateCandidate(candidate)) {
                    consolidated += 1;
                    succeededCandidates.push(candidate);
                } else {
                    failedCandidates.push(candidate);
                }
            }

            return consolidated;
        },
        effect => Db.transaction(effect)
    );

    const processCandidateBatch = Effect.fnUntraced(function* (candidates: readonly Candidate[]) {
        let consolidated = 0;
        const succeededCandidates: Candidate[] = [];
        const failedCandidates: Candidate[] = [];

        for (let chunkStart = 0; chunkStart < candidates.length; chunkStart += TRANSACTION_BATCH_SIZE) {
            consolidated += yield* processChunk(
                candidates.slice(chunkStart, chunkStart + TRANSACTION_BATCH_SIZE),
                succeededCandidates,
                failedCandidates
            );

            if (chunkStart + TRANSACTION_BATCH_SIZE < candidates.length) {
                yield* YIELD_TO_UI;
            }
        }

        return { consolidated, succeededCandidates, failedCandidates };
    });

    const processCandidateList = Effect.fn('ConsolidationFamilyStrategyService.processCandidateList')(function* (
        candidates: readonly Candidate[]
    ) {
        const { consolidated } = yield* processCandidateBatch(candidates);

        return consolidated;
    });

    return {
        preview: Effect.fn('ConsolidationFamilyStrategyService.preview')(function* (context: ConsolidationFamilyRunContextInterface) {
            const candidates = yield* buildRunnableCandidates(context.scope, context.blockedSourceTransactionIds, new Set());

            return {
                blockedSourceTransactionIds: buildBlockedSourceTransactionIds(candidates),
                found: candidates.length
            };
        }),
        process: Effect.fn('ConsolidationFamilyStrategyService.process')(function* (context: ConsolidationFamilyRunContextInterface) {
            const prepareResult = yield* prepareProcess(context);
            const familyScope =
                isDefined(context.scope) && isNotEmptyArray(prepareResult.releasedTransactionIds)
                    ? {
                          ...context.scope,
                          transactionIds: [...new Set([...context.scope.transactionIds, ...prepareResult.releasedTransactionIds])]
                      }
                    : context.scope;

            const succeededBlockedSourceTransactionIds = new Set<number>();
            const localBlockedSourceTransactionIds = new Set<number>(context.blockedSourceTransactionIds);
            const failedCandidateKeys = new Set<string>();
            let consolidated = 0;
            let found = 0;
            let shouldContinue = true;

            const processPass = Effect.fnUntraced(function* (foundBefore: number) {
                const candidates = yield* buildRunnableCandidates(familyScope, localBlockedSourceTransactionIds, failedCandidateKeys);

                if (!isNotEmptyArray(candidates)) {
                    return { consolidated: 0, found: foundBefore };
                }

                const foundInPass = foundBefore + candidates.length;
                const {
                    consolidated: consolidatedInPass,
                    succeededCandidates,
                    failedCandidates
                } = yield* processCandidateBatch(candidates);

                for (const sourceTransactionId of buildBlockedSourceTransactionIds(succeededCandidates)) {
                    succeededBlockedSourceTransactionIds.add(sourceTransactionId);
                    localBlockedSourceTransactionIds.add(sourceTransactionId);
                }

                for (const failedCandidate of failedCandidates) {
                    failedCandidateKeys.add(getCandidateKey(failedCandidate));
                }

                context.onProgress?.(foundInPass);
                yield* YIELD_TO_UI;

                return { consolidated: consolidatedInPass, found: foundInPass };
            });

            while (shouldContinue) {
                const { consolidated: consolidatedInPass, found: foundAfterPass } = yield* processPass(found);

                consolidated += consolidatedInPass;
                found = foundAfterPass;
                shouldContinue = definition.shouldRepeatAfterSuccessfulPass === true && consolidatedInPass > 0;
            }

            return {
                blockedSourceTransactionIds: [...succeededBlockedSourceTransactionIds],
                releasedTransactionIds: [...prepareResult.releasedTransactionIds],
                consolidated: Math.max(consolidated, prepareResult.repairedCount),
                found: Math.max(found, prepareResult.repairedCount)
            } satisfies ConsolidationFamilyRunResultInterface;
        }),
        processCandidateList
    };
};
