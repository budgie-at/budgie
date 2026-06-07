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
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, scope, onProgress) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope, onProgress) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async consolidate(
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const groups = await this.consolidationCandidateService.findGroups(scope);
        const found = this.consolidationAutoCandidateService.countCandidates(groups);
        const consolidated = await this.consolidationAutoCandidateService.processGroups(groups, onProgress);

        return { found, consolidated };
    }

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async countAutoCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<number> {
        const groups = await this.consolidationCandidateService.findGroups(scope);

        return this.consolidationAutoCandidateService.countCandidates(groups);
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
