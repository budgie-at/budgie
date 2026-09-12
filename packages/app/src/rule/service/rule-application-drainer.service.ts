import { Log, getLogger } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { microPause } from '../../@generic/utils/micro-pause.util';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { syncWorkloadService } from '../../sync/service/sync-workload.service';

import { ruleEngineService } from './rule-engine.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { PendingRuleApplicationInterface } from '../interface/pending-rule-application.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

const logger = getLogger('RuleApplicationDrainerService');

class RuleApplicationDrainerService {
    private static readonly DRAIN_DELAY_MS = 250;

    private cancelIdleCallback: (() => void) | null = null;
    private isRunning = false;
    private pendingRuleApplications: PendingRuleApplicationInterface[] = [];
    private pendingTransactionIds: number[] = [];
    private pendingTransactionInputs: TransactionCreateInputInterface[] = [];
    private runPromise: Promise<void> | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;

    @Log(
        (transactionIds, transactionInputs) =>
            `enter queuedTransactionIds="${transactionIds.join(',')}" queuedInputCount=${transactionInputs.length}`,
        (_result, transactionIds, transactionInputs) =>
            `done queuedTransactionIds="${transactionIds.join(',')}" queuedInputCount=${transactionInputs.length}`,
        (error, transactionIds, transactionInputs) =>
            `throw queuedTransactionIds="${transactionIds.join(',')}" queuedInputCount=${transactionInputs.length} error=${getErrorMessage(error)}`
    )
    enqueueTransactions(transactionIds: number[], transactionInputs: TransactionCreateInputInterface[]): void {
        if (!isNotEmptyArray(transactionIds) || !isNotEmptyArray(transactionInputs)) {
            return;
        }

        this.pendingTransactionIds.push(...transactionIds);
        this.pendingTransactionInputs.push(...transactionInputs);
        this.scheduleDrain();
    }

    @Log(
        (ruleId, onSettled) => `enter ruleId=${ruleId} hasOnSettled=${String(isDefined(onSettled))}`,
        (_result, ruleId, onSettled) => `done ruleId=${ruleId} hasOnSettled=${String(isDefined(onSettled))}`,
        (error, ruleId, onSettled) => `throw ruleId=${ruleId} hasOnSettled=${String(isDefined(onSettled))} error=${getErrorMessage(error)}`
    )
    enqueueRuleApplication(ruleId: number, onSettled?: (result: ApplyRuleResultInterface | null, error: unknown) => void): void {
        if (this.pendingRuleApplications.some(pending => pending.ruleId === ruleId)) {
            return;
        }

        this.pendingRuleApplications.push({ ruleId, onSettled });
        this.scheduleDrain();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelPending(): void {
        this.pendingRuleApplications = [];
        this.pendingTransactionIds = [];
        this.pendingTransactionInputs = [];
        this.cancelScheduledDrain();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async drainPending(): Promise<void> {
        this.cancelScheduledDrain();

        if (this.isRunning && isDefined(this.runPromise)) {
            await this.runPromise;

            return;
        }

        this.runPromise = this.run();

        try {
            await this.runPromise;
        } finally {
            this.runPromise = null;
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async run(): Promise<void> {
        this.isRunning = true;

        try {
            await this.drainNextBatch();
        } finally {
            this.isRunning = false;
        }
    }

    private async drainNextBatch(): Promise<void> {
        if (!isNotEmptyArray(this.pendingTransactionIds) && !isNotEmptyArray(this.pendingRuleApplications)) {
            return;
        }

        await this.processPendingTransactionBatch();
        await this.processPendingRuleBatch();
        await this.drainNextBatch();
    }

    private async processPendingTransactionBatch(): Promise<void> {
        if (!isNotEmptyArray(this.pendingTransactionIds)) {
            return;
        }

        const transactionIds = this.pendingTransactionIds;
        const transactionInputs = this.pendingTransactionInputs;

        this.pendingTransactionIds = [];
        this.pendingTransactionInputs = [];

        await syncWorkloadService
            .run('rule-application-transactions', () => ruleEngineService.applyRulesToTransactions(transactionIds, transactionInputs))
            .catch((error: unknown) => {
                logger.error('processPendingTransactionBatch:throw', {
                    queuedTransactionIds: transactionIds.join(','),
                    queuedInputCount: transactionInputs.length,
                    errorMessage: getErrorMessage(error)
                });
            });
        await microPause();
    }

    private async processPendingRuleBatch(): Promise<void> {
        const pending = this.pendingRuleApplications.shift();

        if (!isDefined(pending)) {
            return;
        }

        try {
            const result = await syncWorkloadService.run('rule-application-rule', () =>
                ruleEngineService.applyRuleToMatchingTransactions(pending.ruleId, null)
            );
            pending.onSettled?.(result, null);
        } catch (error: unknown) {
            logger.error('processPendingRuleBatch:throw', {
                ruleId: pending.ruleId,
                errorMessage: getErrorMessage(error)
            });
            pending.onSettled?.(null, error);
        }

        await microPause();
        await this.processPendingRuleBatch();
    }

    private scheduleDrain(): void {
        if (isDefined(this.timer) || this.isRunning) {
            return;
        }

        this.timer = setTimeout(() => {
            this.timer = null;
            this.cancelIdleCallback = scheduleIdleCallback(() => {
                this.cancelIdleCallback = null;
                this.drainPending().catch(emptyFn);
            });
        }, RuleApplicationDrainerService.DRAIN_DELAY_MS);
    }

    private cancelScheduledDrain(): void {
        if (isDefined(this.timer)) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.cancelIdleCallback?.();
        this.cancelIdleCallback = null;
    }
}

export const ruleApplicationDrainerService = new RuleApplicationDrainerService();
