import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import type { ConsolidationAutoCandidateService } from './consolidation-auto-candidate.service';
import type { ConsolidationCandidateService } from './consolidation-candidate.service';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class ConsolidationCoordinatorService {
    constructor(
        private readonly consolidationCandidateService: ConsolidationCandidateService,
        private readonly consolidationAutoCandidateService: ConsolidationAutoCandidateService
    ) {}

    @Log(
        (scope, onProgress) =>
            `enter hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, scope, onProgress) =>
            `done hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope, onProgress) =>
            `throw hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async consolidate(
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        return this.consolidationAutoCandidateService.process(scope, onProgress);
    }

    @Log(
        scope => `enter hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0}`,
        (result, scope) => `done hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} count=${result}`,
        (error, scope) =>
            `throw hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} error=${getErrorMessage(error)}`
    )
    async countAutoCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<number> {
        return this.consolidationAutoCandidateService.count(scope);
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countManualReviewCandidates(): Promise<number> {
        return this.consolidationCandidateService.countManualReviewCandidates();
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countExistingTransferIncomeDuplicateRepairCandidates(): Promise<number> {
        return (await this.consolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates()).length;
    }

    @Log('enter', result => `done repairedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async repairExistingTransferIncomeDuplicates(): Promise<number> {
        const candidates = await this.consolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates();

        return this.consolidationAutoCandidateService.processExistingTransferIncomeDuplicateCandidates(candidates);
    }
}
