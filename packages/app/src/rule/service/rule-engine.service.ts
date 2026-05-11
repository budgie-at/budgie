import { RuleActionTypeEnum, RuleConditionFieldEnum, TransactionUpdatedByEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    mccCategoryRepository,
    ruleRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE } from '../constant/batch-processing.constant';
import { convertTransactionToTransfer } from '../util/convert-transaction-to-transfer.util';

import { ruleMatcherService } from './rule-matcher.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { DB, RuleActionEntityInterface, RuleWithRelationsEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';

class RuleEngineService {
    @Log(
        (transactionIds, transactionInputs) => `enter transactionIds=${transactionIds.join(',')} inputCount=${transactionInputs.length}`,
        (_result, transactionIds, transactionInputs) =>
            `done transactionIds=${transactionIds.join(',')} inputCount=${transactionInputs.length}`,
        (error, transactionIds, transactionInputs) =>
            `throw transactionIds=${transactionIds.join(',')} inputCount=${transactionInputs.length} error=${getErrorMessage(error)}`
    )
    async applyRulesToTransactions(transactionIds: number[], transactionInputs: TransactionCreateInputInterface[]): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        const mccCodeMap = await this.buildMccCodeMapIfNeeded(rules, transactionInputs);
        const evaluationInputs = transactionInputs.map(input => this.toRuleEvaluationInput(input, mccCodeMap));

        await this.getBatchStarts(transactionIds.length).reduce(
            (previousBatch, batchStart) =>
                previousBatch.then(() => this.applyRulesToTransactionsBatch(batchStart, transactionIds, evaluationInputs, rules)),
            Promise.resolve()
        );
    }

    @Log(
        ruleId => `enter ruleId=${ruleId}`,
        (result, ruleId, onProgress) =>
            `done ruleId=${ruleId} hasProgress=${isDefined(onProgress)} applied=${result.applied} failed=${result.failed} total=${result.total}`,
        (error, ruleId, onProgress) => `throw ruleId=${ruleId} hasProgress=${isDefined(onProgress)} error=${getErrorMessage(error)}`
    )
    async applyRuleToMatchingTransactions(
        ruleId: number,
        onProgress: ((processed: number, total: number) => void) | null
    ): Promise<ApplyRuleResultInterface> {
        const rule = await ruleRepository.findByIdWithRelations(ruleId);
        const emptyResult: ApplyRuleResultInterface = { applied: 0, failed: 0, total: 0 };

        if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
            return emptyResult;
        }

        const matchingIds = await ruleMatcherService.collectMatchingTransactionIds(rule);

        if (!isNotEmptyArray(matchingIds)) {
            return emptyResult;
        }

        const total = matchingIds.length;
        const failed = await this.applyRuleToMatchingTransactionBatches(matchingIds, rule.actions, onProgress);

        const applied = total - failed;

        return { applied, failed, total };
    }

    private async applyRulesToTransactionsBatch(
        batchStart: number,
        transactionIds: number[],
        evaluationInputs: RuleEvaluationInputInterface[],
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        await this.waitForNextBatch();

        const batchIds = transactionIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
        await Promise.all(
            batchIds.map((transactionId, offset) =>
                this.applyRulesToTransaction(transactionId, evaluationInputs[batchStart + offset], rules)
            )
        );
    }

    private async applyRuleToMatchingTransactionBatches(
        matchingIds: number[],
        actions: RuleActionEntityInterface[],
        onProgress: ((processed: number, total: number) => void) | null
    ): Promise<number> {
        let processed = 0;
        let failed = 0;
        const total = matchingIds.length;

        await this.getBatchStarts(total).reduce(
            (previousBatch, batchStart) =>
                previousBatch.then(async () => {
                    const batchIds = matchingIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
                    const batchFailed = await this.applyRuleToMatchingTransactionBatch(batchIds, actions);

                    failed += batchFailed;
                    processed += batchIds.length;
                    onProgress?.(processed, total);

                    return null;
                }),
            Promise.resolve(null)
        );

        return failed;
    }

    private async applyRuleToMatchingTransactionBatch(batchIds: number[], actions: RuleActionEntityInterface[]): Promise<number> {
        await this.waitForNextBatch();

        const results = await Promise.allSettled(batchIds.map(transactionId => this.applyRuleActionsToTransaction(transactionId, actions)));

        return results.filter(result => result.status === 'rejected').length;
    }

    private async applyRulesToTransaction(
        transactionId: number,
        input: RuleEvaluationInputInterface,
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        const matchingRules = rules.filter(rule => ruleMatcherService.evaluateRule(rule, input));

        if (!isNotEmptyArray(matchingRules)) {
            return;
        }

        const appliedExclusiveActions = new Set<RuleActionTypeEnum>();

        await transactionAsync(db, async transaction => {
            await matchingRules.reduce(
                (previousRule, rule) =>
                    previousRule.then(() => this.applyRuleActions(transactionId, rule.actions, transaction, appliedExclusiveActions)),
                Promise.resolve()
            );
            await transactionRepository.updateById(transactionId, { updatedBy: TransactionUpdatedByEnum.RULE }, transaction);
        });
    }

    private getBatchStarts(total: number): number[] {
        return Array.from({ length: Math.ceil(total / RULE_BATCH_SIZE) }, (_value, index) => index * RULE_BATCH_SIZE);
    }

    private async waitForNextBatch(): Promise<void> {
        await new Promise<void>(resolve => {
            setTimeout(resolve, RULE_BATCH_DELAY_MS);
        });
    }

    private async applyRuleActionsToTransaction(transactionId: number, actions: RuleActionEntityInterface[]): Promise<void> {
        await transactionAsync(db, async transaction => {
            await this.applyRuleActions(transactionId, actions, transaction, new Set<RuleActionTypeEnum>());
            await transactionRepository.updateById(transactionId, { updatedBy: TransactionUpdatedByEnum.RULE }, transaction);
        });
    }

    private toRuleEvaluationInput(input: TransactionCreateInputInterface, mccCodeMap: Map<number, string>): RuleEvaluationInputInterface {
        return {
            ...input,
            entries: input.entries.map(entry => ({
                ...entry,
                mccCode: isDefined(entry.mccCategoryId) ? (mccCodeMap.get(entry.mccCategoryId) ?? null) : null
            }))
        };
    }

    private async buildMccCodeMapIfNeeded(
        rules: RuleWithRelationsEntityInterface[],
        inputs: TransactionCreateInputInterface[]
    ): Promise<Map<number, string>> {
        const emptyMap = new Map<number, string>();
        const hasMccCondition = rules.some(rule => rule.conditions.some(condition => condition.field === RuleConditionFieldEnum.MCC_CODE));

        if (!hasMccCondition) {
            return emptyMap;
        }

        const mccCategoryIds = new Set(inputs.flatMap(input => input.entries.map(entry => entry.mccCategoryId).filter(isDefined)));

        if (mccCategoryIds.size === 0) {
            return emptyMap;
        }

        const mccCategories = await mccCategoryRepository.findAll();

        return new Map(mccCategories.filter(category => mccCategoryIds.has(category.id)).map(category => [category.id, category.mcc]));
    }

    private async applyRuleActions(
        transactionId: number,
        actions: RuleActionEntityInterface[],
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<void> {
        const sortedActions = [...actions].sort((actionA, actionB) => {
            if (actionA.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                return 1;
            }

            if (actionB.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                return -1;
            }

            return 0;
        });

        await sortedActions.reduce(
            (previousAction, action) =>
                previousAction.then(() => this.applyRuleAction(transactionId, action, transaction, appliedExclusiveActions)),
            Promise.resolve()
        );
    }

    private async applyRuleAction(
        transactionId: number,
        action: RuleActionEntityInterface,
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<void> {
        switch (action.type) {
            case RuleActionTypeEnum.SET_CATEGORY:
                await this.applySetCategoryAction(transactionId, action, transaction, appliedExclusiveActions);
                break;

            case RuleActionTypeEnum.ADD_TAG:
                await this.applyAddTagAction(transactionId, action, transaction);
                break;

            case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
                await this.applyConvertToTransferAction(transactionId, action, transaction, appliedExclusiveActions);
                break;

            default:
                break;
        }
    }

    private async applySetCategoryAction(
        transactionId: number,
        action: RuleActionEntityInterface,
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<void> {
        if (!isDefined(action.categoryId) || appliedExclusiveActions.has(RuleActionTypeEnum.SET_CATEGORY)) {
            return;
        }

        appliedExclusiveActions.add(RuleActionTypeEnum.SET_CATEGORY);
        await transactionEntryRepository.updateCategoryByTransactionId(transactionId, action.categoryId, transaction);
        await transactionRepository.touchUpdatedAt(transactionId, transaction);
    }

    private async applyAddTagAction(transactionId: number, action: RuleActionEntityInterface, transaction: DB): Promise<void> {
        if (!isDefined(action.tagId)) {
            return;
        }

        const existingTags = await transactionTagsRepository.findByTransactionId(transactionId, transaction);
        const hasTag = existingTags.some(tag => tag.tagId === action.tagId);

        if (hasTag) {
            return;
        }

        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId, isPrimary: false }], transaction);
        await transactionRepository.touchUpdatedAt(transactionId, transaction);
    }

    private async applyConvertToTransferAction(
        transactionId: number,
        action: RuleActionEntityInterface,
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<void> {
        if (!isDefined(action.accountId) || appliedExclusiveActions.has(RuleActionTypeEnum.CONVERT_TO_TRANSFER)) {
            return;
        }

        appliedExclusiveActions.add(RuleActionTypeEnum.CONVERT_TO_TRANSFER);
        await convertTransactionToTransfer({
            transactionId,
            targetAccountId: action.accountId,
            dbTransaction: transaction
        });
    }
}

export const ruleEngineService = new RuleEngineService();
