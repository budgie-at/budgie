import {
    RuleActionEntityInterface,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface,
    TransactionUpdatedByEnum,
    TransactionWithEntriesMccCategoryEntityInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    mccCategoryRepository,
    ruleRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE } from '../constant/batch-processing.constant';
import { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import { CountConditionsParamsInterface } from '../interface/count-conditions-params.interface';
import { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import { convertTransactionToTransfer } from '../util/convert-transaction-to-transfer.util';

import { ruleMatcherService } from './rule-matcher.service';

class RuleEngineService {
    async applyRulesToTransactions(transactionIds: number[], transactionInputs: TransactionCreateInputInterface[]): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        const mccCodeMap = await this.buildMccCodeMapIfNeeded(rules, transactionInputs);
        const evaluationInputs = transactionInputs.map(input => this.toRuleEvaluationInput(input, mccCodeMap));

        for (let batchStart = 0; batchStart < transactionIds.length; batchStart += RULE_BATCH_SIZE) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, RULE_BATCH_DELAY_MS);
            });

            const batchIds = transactionIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
            // eslint-disable-next-line no-await-in-loop
            await Promise.allSettled(
                batchIds.map((transactionId, offset) =>
                    this.applyRulesToTransaction(transactionId, evaluationInputs[batchStart + offset], rules)
                )
            );
        }
    }

    async countMatchingTransactions(params: CountConditionsParamsInterface): Promise<number> {
        return ruleMatcherService.countMatchingTransactions(params);
    }

    async findMatchingTransactions(
        params: CountConditionsParamsInterface,
        limit: number
    ): Promise<{ transactions: TransactionWithEntriesMccCategoryEntityInterface[]; count: number }> {
        return ruleMatcherService.findMatchingTransactions(params, limit);
    }

    // eslint-disable-next-line max-statements -- Two-phase batch processing with progress tracking
    async applyRuleToMatchingTransactions(
        ruleId: number,
        onProgress?: (processed: number, total: number) => void
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
        let processed = 0;
        let failed = 0;

        for (let batchStart = 0; batchStart < total; batchStart += RULE_BATCH_SIZE) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, RULE_BATCH_DELAY_MS);
            });

            const batchIds = matchingIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
            // eslint-disable-next-line no-await-in-loop
            const results = await Promise.allSettled(
                batchIds.map(transactionId => this.applyRuleActionsToTransaction(transactionId, rule.actions))
            );

            for (const result of results) {
                if (result.status === 'rejected') {
                    failed += 1;
                }
            }

            processed += batchIds.length;
            onProgress?.(processed, total);
        }

        const applied = total - failed;

        return { applied, failed, total };
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

        await db.transaction(async transaction => {
            for (const rule of matchingRules) {
                // eslint-disable-next-line no-await-in-loop
                await this.applyRuleActions(transactionId, rule.actions, transaction, appliedExclusiveActions);
            }
            await transactionRepository.updateById(transactionId, { updatedBy: TransactionUpdatedByEnum.RULE }, transaction);
        });
    }

    private async applyRuleActionsToTransaction(transactionId: number, actions: RuleActionEntityInterface[]): Promise<void> {
        await db.transaction(async transaction => {
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
        transaction: Transaction,
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

        for (const action of sortedActions) {
            switch (action.type) {
                case RuleActionTypeEnum.SET_CATEGORY:
                    if (isDefined(action.categoryId) && !appliedExclusiveActions.has(RuleActionTypeEnum.SET_CATEGORY)) {
                        appliedExclusiveActions.add(RuleActionTypeEnum.SET_CATEGORY);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionEntryRepository.updateCategoryByTransactionId(transactionId, action.categoryId, transaction);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionRepository.touchUpdatedAt(transactionId, transaction);
                    }
                    break;

                case RuleActionTypeEnum.ADD_TAG:
                    if (isDefined(action.tagId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId, isPrimary: false }], transaction);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionRepository.touchUpdatedAt(transactionId, transaction);
                    }
                    break;

                case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
                    if (isDefined(action.accountId) && !appliedExclusiveActions.has(RuleActionTypeEnum.CONVERT_TO_TRANSFER)) {
                        appliedExclusiveActions.add(RuleActionTypeEnum.CONVERT_TO_TRANSFER);
                        // eslint-disable-next-line no-await-in-loop
                        await convertTransactionToTransfer({
                            transactionId,
                            targetAccountId: action.accountId,
                            dbTransaction: transaction
                        });
                    }
                    break;

                default:
                    break;
            }
        }
    }
}

export const ruleEngineService = new RuleEngineService();
