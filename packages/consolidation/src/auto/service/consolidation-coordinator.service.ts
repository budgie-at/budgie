import { Log } from '@budgie/logger';

import { isError } from '@rnw-community/shared';

import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationAutoCandidateService } from './consolidation-auto-candidate.service';
import type { ConsolidationCandidateService } from './consolidation-candidate.service';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class ConsolidationCoordinatorService {
    constructor(
        private readonly consolidationCandidateService: ConsolidationCandidateService,
        private readonly consolidationAutoCandidateService: ConsolidationAutoCandidateService
    ) {}

    @Log.withoutErrorPayload(
        () => 'enter consolidate',
        result => `done foundCount=${result.found} consolidatedCount=${result.consolidated}`,
        error => `throw consolidateErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidate(
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        return this.consolidationAutoCandidateService.process(scope, onProgress);
    }

    @Log.withoutErrorPayload(
        () => 'enter countAutoCandidates',
        result => `done candidateCount=${result}`,
        error => `throw countAutoCandidatesErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async countAutoCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<number> {
        return this.consolidationAutoCandidateService.count(scope);
    }

    @Log.withoutErrorPayload(
        'enter',
        result => `done count=${result}`,
        error => `throw errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async countManualReviewCandidates(): Promise<number> {
        return this.consolidationCandidateService.countManualReviewCandidates();
    }

    @Log.withoutErrorPayload(
        'enter',
        result => `done count=${result}`,
        error => `throw errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async countExistingTransferIncomeDuplicateRepairCandidates(): Promise<number> {
        return (await this.consolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates()).length;
    }

    @Log.withoutErrorPayload(
        'enter',
        result => `done repairedCount=${result}`,
        error => `throw errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async repairExistingTransferIncomeDuplicates(): Promise<number> {
        const candidates = await this.consolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates();

        return this.consolidationAutoCandidateService.processExistingTransferIncomeDuplicateCandidates(candidates);
    }
}
