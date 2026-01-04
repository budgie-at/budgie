import {
    RuleActionEntityInterface,
    RuleActionTypeEnum,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleRepository, transactionEntryRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

class RuleEngineService {
    async applyRulesToTransactions(
        transactionIds: number[],
        transactionInputs: TransactionCreateInputInterface[]
    ): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        for (let i = 0; i < transactionIds.length; i += 1) {
            const transactionId = transactionIds[i];
            const input = transactionInputs[i];

            // eslint-disable-next-line no-await-in-loop
            await this.applyRulesToTransaction(transactionId, input, rules);
        }
    }

    private async applyRulesToTransaction(
        transactionId: number,
        input: TransactionCreateInputInterface,
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        const matchingRules = rules.filter(rule => this.evaluateRule(rule, input));

        if (!isNotEmptyArray(matchingRules)) {
            return;
        }

        await db.transaction(async tx => {
            for (const rule of matchingRules) {
                // eslint-disable-next-line no-await-in-loop
                await this.applyRuleActions(transactionId, rule.actions, tx);
            }
        });
    }

    private evaluateRule(rule: RuleWithRelationsEntityInterface, input: TransactionCreateInputInterface): boolean {
        if (!isNotEmptyArray(rule.conditions)) {
            return false;
        }

        return rule.conditions.every(condition => evaluateRuleCondition(condition, input));
    }

    private async applyRuleActions(
        transactionId: number,
        actions: RuleActionEntityInterface[],
        tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
    ): Promise<void> {
        for (const action of actions) {
            switch (action.type) {
                case RuleActionTypeEnum.SET_CATEGORY:
                    if (isDefined(action.categoryId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionEntryRepository.updateCategoryByTransactionId(transactionId, action.categoryId, tx);
                    }
                    break;

                case RuleActionTypeEnum.ADD_TAG:
                    if (isDefined(action.tagId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId }], tx);
                    }
                    break;

                default:
                    break;
            }
        }
    }
}

export const ruleEngineService = new RuleEngineService();
