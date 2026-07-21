import { Log } from '@budgie/logger';

import { isError } from '@rnw-community/shared';

import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationFamilyRegistryService } from './consolidation-family-registry.service';
import type { ConsolidationScanScopeInterface, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

export class ConsolidationAutoCandidateService {
    constructor(private readonly consolidationFamilyRegistryService: ConsolidationFamilyRegistryService) {}

    @Log.withoutErrorPayload(
        () => 'enter process',
        result => `done foundCount=${result.found} consolidatedCount=${result.consolidated}`,
        error => `throw processErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async process(
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const families = this.consolidationFamilyRegistryService.buildFamilies();
        let resultPromise = Promise.resolve({
            blockedSourceTransactionIds: new Set<number>(),
            consolidated: 0,
            found: 0,
            processedCandidateGroupCount: 0
        });

        for (const family of families) {
            resultPromise = resultPromise.then(async currentResult => {
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
            });
        }
        const result = await resultPromise;

        return { found: result.found, consolidated: result.consolidated };
    }

    @Log.withoutErrorPayload(
        () => 'enter count',
        result => `done candidateCount=${result}`,
        error => `throw countErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async count(scope: ConsolidationScanScopeInterface | null = null): Promise<number> {
        const families = this.consolidationFamilyRegistryService.buildFamilies();
        let resultPromise = Promise.resolve({ blockedSourceTransactionIds: new Set<number>(), found: 0 });

        for (const family of families) {
            resultPromise = resultPromise.then(async currentResult => {
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
            });
        }
        const result = await resultPromise;

        return result.found;
    }

    @Log.withoutErrorPayload(
        candidates => `enter existingTransferIncomeDuplicateCount=${candidates.length}`,
        (result, candidates) => `done existingTransferIncomeDuplicateCount=${candidates.length} consolidated=${result}`,
        (error, candidates) =>
            `throw existingTransferIncomeDuplicateCount=${candidates.length} errorClass=${isError(error) ? error.name : 'UnknownError'}`
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
