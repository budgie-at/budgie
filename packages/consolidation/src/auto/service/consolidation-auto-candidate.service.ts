import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import type { ConsolidationFamilyRegistryService } from './consolidation-family-registry.service';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationScanScopeInterface, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

export class ConsolidationAutoCandidateService {
    constructor(private readonly consolidationFamilyRegistryService: ConsolidationFamilyRegistryService) {}

    @Log(
        (scope, onProgress) => `enter scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, scope, onProgress) =>
            `done scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope, onProgress) =>
            `throw scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async process(
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const result = await this.consolidationFamilyRegistryService.buildFamilies().reduce(
            async (resultPromise, family) => {
                const currentResult = await resultPromise;
                const familyResult = await family.process({
                    blockedSourceTransactionIds: currentResult.blockedSourceTransactionIds,
                    onProgress: processedCount => {
                        const processedCandidateGroupCount = currentResult.processedCandidateGroupCount + processedCount;
                        onProgress?.(processedCandidateGroupCount);
                    },
                    scope
                });
                const blockedSourceTransactionIds = new Set(currentResult.blockedSourceTransactionIds);
                this.addBlockedSourceTransactionIds(blockedSourceTransactionIds, familyResult.blockedSourceTransactionIds);

                return {
                    blockedSourceTransactionIds,
                    consolidated: currentResult.consolidated + familyResult.consolidated,
                    found: currentResult.found + familyResult.found,
                    processedCandidateGroupCount: currentResult.processedCandidateGroupCount + familyResult.found
                };
            },
            Promise.resolve({ blockedSourceTransactionIds: new Set<number>(), consolidated: 0, found: 0, processedCandidateGroupCount: 0 })
        );

        return { found: result.found, consolidated: result.consolidated };
    }

    @Log(
        scope => `enter scopeIdCount=${scope?.transactionIds.length ?? 0}`,
        (result, scope) => `done scopeIdCount=${scope?.transactionIds.length ?? 0} count=${result}`,
        (error, scope) => `throw scopeIdCount=${scope?.transactionIds.length ?? 0} error=${getErrorMessage(error)}`
    )
    async count(scope: ConsolidationScanScopeInterface | null = null): Promise<number> {
        const result = await this.consolidationFamilyRegistryService.buildFamilies().reduce(
            async (resultPromise, family) => {
                const currentResult = await resultPromise;
                const preview = await family.preview({
                    blockedSourceTransactionIds: currentResult.blockedSourceTransactionIds,
                    scope
                });
                const blockedSourceTransactionIds = new Set(currentResult.blockedSourceTransactionIds);
                this.addBlockedSourceTransactionIds(blockedSourceTransactionIds, preview.blockedSourceTransactionIds);

                return {
                    blockedSourceTransactionIds,
                    found: currentResult.found + preview.found
                };
            },
            Promise.resolve({ blockedSourceTransactionIds: new Set<number>(), found: 0 })
        );

        return result.found;
    }

    @Log(
        candidates => `enter existingTransferIncomeDuplicateCount=${candidates.length}`,
        (result, candidates) => `done existingTransferIncomeDuplicateCount=${candidates.length} consolidated=${result}`,
        (error, candidates) => `throw existingTransferIncomeDuplicateCount=${candidates.length} error=${getErrorMessage(error)}`
    )
    async processExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.consolidationFamilyRegistryService.buildExistingTransferIncomeDuplicateFamily().processCandidateList(candidates);
    }

    private addBlockedSourceTransactionIds(blockedSourceTransactionIds: Set<number>, sourceTransactionIds: number[]): void {
        for (const sourceTransactionId of sourceTransactionIds) {
            blockedSourceTransactionIds.add(sourceTransactionId);
        }
    }
}
