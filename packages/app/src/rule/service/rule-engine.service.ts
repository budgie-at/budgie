import {
    RuleActionEntityInterface,
    RuleActionTypeEnum,
    RuleConditionCreateInputInterface,
    RuleConditionMatchTypeEnum,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    ruleRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import { convertTransactionToTransfer } from '../util/convert-transaction-to-transfer.util';

import { ruleMatcherService } from './rule-matcher.service';

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 50;

interface CountConditionsParams {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
}

class RuleEngineService {
    async applyRulesToTransactions(transactionIds: number[], transactionInputs: TransactionCreateInputInterface[]): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        await Promise.all(
            transactionIds.map((transactionId, index) => this.applyRulesToTransaction(transactionId, transactionInputs[index], rules))
        );
    }

    async countMatchingTransactions(params: CountConditionsParams): Promise<number> {
        return ruleMatcherService.countMatchingTransactions(params);
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

        for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, BATCH_DELAY_MS);
            });

            const batchIds = matchingIds.slice(batchStart, batchStart + BATCH_SIZE);
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
        input: TransactionCreateInputInterface,
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        const matchingRules = rules.filter(rule => ruleMatcherService.evaluateRule(rule, input));

        if (!isNotEmptyArray(matchingRules)) {
            return;
        }

        await db.transaction(async transaction => {
            for (const rule of matchingRules) {
                // eslint-disable-next-line no-await-in-loop
                await this.applyRuleActions(transactionId, rule.actions, transaction);
            }
        });
    }

    private async applyRuleActionsToTransaction(transactionId: number, actions: RuleActionEntityInterface[]): Promise<void> {
        await db.transaction(async transaction => {
            await this.applyRuleActions(transactionId, actions, transaction);
        });
    }

    private async applyRuleActions(transactionId: number, actions: RuleActionEntityInterface[], transaction: Transaction): Promise<void> {
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
                    if (isDefined(action.categoryId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionEntryRepository.updateCategoryByTransactionId(transactionId, action.categoryId, transaction);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionRepository.touchUpdatedAt(transactionId, transaction);
                    }
                    break;

                case RuleActionTypeEnum.ADD_TAG:
                    if (isDefined(action.tagId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId }], transaction);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionRepository.touchUpdatedAt(transactionId, transaction);
                    }
                    break;

                case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
                    if (isDefined(action.accountId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await convertTransactionToTransfer({ transactionId, targetAccountId: action.accountId, tx: transaction });
                    }
                    break;

                default:
                    break;
            }
        }
    }
}

export const ruleEngineService = new RuleEngineService();
