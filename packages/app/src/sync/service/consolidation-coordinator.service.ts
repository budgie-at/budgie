import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { refundPairRepository, transferPairRepository } from '../../@generic/drizzle/db/db';

import { consolidationRuleRegistryService } from './consolidation-rule-registry.service';

import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class ConsolidationCoordinatorService {
    @Log(
        (scope, onProgress) =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, scope, onProgress) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope, onProgress) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async consolidate(
        scope: ConsolidationScanScopeInterface | null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const claimedTransactionIds = new Set<number>();
        const runners = consolidationRuleRegistryService.getRunners();
        const found = 0;
        const consolidated = 0;
        let processedCandidateGroupCount = 0;
        const publishProgress = (processedCount: number) => {
            processedCandidateGroupCount += processedCount;
            onProgress?.(processedCandidateGroupCount);
        };

        return runners.reduce(async (resultPromise, runner) => {
            const currentResult = await resultPromise;
            const result = await runner.process(claimedTransactionIds, publishProgress, scope);

            return {
                found: currentResult.found + result.found,
                consolidated: currentResult.consolidated + result.consolidated
            };
        }, Promise.resolve({ found, consolidated }));
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
        const claimedTransactionIds = new Set<number>();
        const runners = consolidationRuleRegistryService.getRunners();
        const count = 0;

        return runners.reduce(async (countPromise, runner) => {
            const currentCount = await countPromise;
            const runnerCount = await runner.countCandidates(claimedTransactionIds, scope);

            return currentCount + runnerCount;
        }, Promise.resolve(count));
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countManualReviewCandidates(): Promise<number> {
        const manualReviewCandidates = await transferPairRepository.findManualReviewCandidates();
        const atmCashWithdrawalReviewCandidates = await transferPairRepository.findAtmCashWithdrawalReviewCandidates();
        const refundReviewCandidates = await refundPairRepository.findReviewCandidates();

        return manualReviewCandidates.length + atmCashWithdrawalReviewCandidates.length + refundReviewCandidates.length;
    }
}

export const consolidationCoordinatorService = new ConsolidationCoordinatorService();
