import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';

import { consolidationSideEffectService } from './consolidation-side-effect.service';

import type { ConsolidationRuleTypeEnum } from '../enum/consolidation-rule-type.enum';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationRuleRunnerInterface } from '../interface/consolidation-rule-runner.interface';
import type { ConsolidationRuleInterface } from '../interface/consolidation-rule.interface';
import type { DB } from '@budgie/contracts';

export class ConsolidationRuleRunnerService<Candidate> implements ConsolidationRuleRunnerInterface {
    constructor(private readonly rule: ConsolidationRuleInterface<Candidate>) {}

    get priority(): number {
        return this.rule.priority;
    }

    get type(): ConsolidationRuleTypeEnum {
        return this.rule.type;
    }

    @Log(
        (claimedTransactionIds, publishProgress) =>
            `enter claimedTransactionIds=${[...claimedTransactionIds].join(',')} hasPublishProgress=${String(isDefined(publishProgress))}`,
        (result, claimedTransactionIds, publishProgress) =>
            `done claimedTransactionIds=${[...claimedTransactionIds].join(',')} hasPublishProgress=${String(isDefined(publishProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, claimedTransactionIds, publishProgress) =>
            `throw claimedTransactionIds=${[...claimedTransactionIds].join(',')} hasPublishProgress=${String(isDefined(publishProgress))} error=${getErrorMessage(error)}`
    )
    async process(
        claimedTransactionIds: Set<number>,
        publishProgress: (processedCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const candidates = await this.rule.findCandidates();

        return candidates.reduce(
            async (resultPromise, candidate) => {
                const currentResult = await resultPromise;
                const sourceTransactionIds = this.rule.getSourceTransactionIds(candidate);
                const result = await this.processCandidate(candidate, sourceTransactionIds, claimedTransactionIds, publishProgress);

                return {
                    found: currentResult.found + result.found,
                    consolidated: currentResult.consolidated + result.consolidated
                };
            },
            Promise.resolve({ found: 0, consolidated: 0 })
        );
    }

    @Log(
        claimedTransactionIds => `enter claimedTransactionIds=${[...claimedTransactionIds].join(',')}`,
        (result, claimedTransactionIds) => `done claimedTransactionIds=${[...claimedTransactionIds].join(',')} count=${result}`,
        (error, claimedTransactionIds) =>
            `throw claimedTransactionIds=${[...claimedTransactionIds].join(',')} error=${getErrorMessage(error)}`
    )
    async countCandidates(claimedTransactionIds: Set<number>): Promise<number> {
        const candidates = await this.rule.findCandidates();
        let count = 0;

        for (const candidate of candidates) {
            const sourceTransactionIds = this.rule.getSourceTransactionIds(candidate);

            if (this.canProcessSourceTransactionIds(sourceTransactionIds, claimedTransactionIds)) {
                count += 1;
                this.claimSourceTransactionIds(sourceTransactionIds, claimedTransactionIds);
            }
        }

        return count;
    }

    @Log(
        (sourceTransactionIds, claimedTransactionIds) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} claimedTransactionIds=${[...claimedTransactionIds].join(',')}`,
        (result, sourceTransactionIds, claimedTransactionIds) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} claimedTransactionIds=${[...claimedTransactionIds].join(',')} result=${String(result)}`,
        (error, sourceTransactionIds, claimedTransactionIds) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} claimedTransactionIds=${[...claimedTransactionIds].join(',')} error=${getErrorMessage(error)}`
    )
    private claimSourceTransactionIds(sourceTransactionIds: number[], claimedTransactionIds: Set<number>): boolean {
        for (const sourceTransactionId of sourceTransactionIds) {
            claimedTransactionIds.add(sourceTransactionId);
        }

        return true;
    }

    @Log(
        (sourceTransactionIds, claimedTransactionIds) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} claimedTransactionIds=${[...claimedTransactionIds].join(',')}`,
        (result, sourceTransactionIds, claimedTransactionIds) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} claimedTransactionIds=${[...claimedTransactionIds].join(',')} result=${String(result)}`,
        (error, sourceTransactionIds, claimedTransactionIds) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} claimedTransactionIds=${[...claimedTransactionIds].join(',')} error=${getErrorMessage(error)}`
    )
    private canProcessSourceTransactionIds(sourceTransactionIds: number[], claimedTransactionIds: Set<number>): boolean {
        return sourceTransactionIds.every(sourceTransactionId => !claimedTransactionIds.has(sourceTransactionId));
    }

    private async processCandidate(
        candidate: Candidate,
        sourceTransactionIds: number[],
        claimedTransactionIds: Set<number>,
        publishProgress: (processedCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        if (!this.canProcessSourceTransactionIds(sourceTransactionIds, claimedTransactionIds)) {
            publishProgress(1);

            return { found: 0, consolidated: 0 };
        }

        this.claimSourceTransactionIds(sourceTransactionIds, claimedTransactionIds);

        const success = await this.consolidateCandidate(candidate).then(
            result => result,
            () => false
        );

        publishProgress(1);

        return {
            found: 1,
            consolidated: success ? 1 : 0
        };
    }

    private async consolidateCandidate(candidate: Candidate): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateCandidateInTransaction(candidate, tx));
    }

    private async consolidateCandidateInTransaction(candidate: Candidate, tx: DB): Promise<boolean> {
        const result = await this.rule.consolidate(candidate, tx);

        if (!result.consolidated) {
            return false;
        }

        const sourceMoveRequests = this.rule.buildSourceMoveRequests(candidate, result);
        await consolidationSideEffectService.moveSources(sourceMoveRequests, tx);

        const tagCopyRequests = this.rule.buildTagCopyRequests(candidate, result);
        await consolidationSideEffectService.copyTags(tagCopyRequests, tx);

        return true;
    }
}
