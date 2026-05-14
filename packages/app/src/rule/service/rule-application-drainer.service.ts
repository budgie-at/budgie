import { Log, getLogger } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { microPause } from '../../@generic/utils/micro-pause.util';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';

import { ruleEngineService } from './rule-engine.service';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const logger = getLogger('RuleApplicationDrainerService');

class RuleApplicationDrainerService {
    private static readonly DRAIN_DELAY_MS = 250;

    private cancelIdleCallback: (() => void) | null = null;
    private isRunning = false;
    private pendingRuleIds: number[] = [];
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
        ruleId => `enter ruleId=${ruleId}`,
        (_result, ruleId) => `done ruleId=${ruleId}`,
        (error, ruleId) => `throw ruleId=${ruleId} error=${getErrorMessage(error)}`
    )
    enqueueRuleApplication(ruleId: number): void {
        if (this.pendingRuleIds.includes(ruleId)) {
            return;
        }

        this.pendingRuleIds.push(ruleId);
        this.scheduleDrain();
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
        if (!isNotEmptyArray(this.pendingTransactionIds) && !isNotEmptyArray(this.pendingRuleIds)) {
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

        await ruleEngineService.applyRulesToTransactions(transactionIds, transactionInputs).catch((error: unknown) => {
            logger.error('processPendingTransactionBatch:throw', {
                queuedTransactionIds: transactionIds.join(','),
                queuedInputCount: transactionInputs.length,
                errorMessage: getErrorMessage(error)
            });
        });
        await microPause();
    }

    private async processPendingRuleBatch(): Promise<void> {
        const ruleId = this.pendingRuleIds.shift();

        if (!isDefined(ruleId)) {
            return;
        }

        await ruleEngineService.applyRuleToMatchingTransactions(ruleId, null).catch((error: unknown) => {
            logger.error('processPendingRuleBatch:throw', {
                ruleId,
                errorMessage: getErrorMessage(error)
            });
        });
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
