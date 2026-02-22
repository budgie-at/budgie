import { RuleCreateInputInterface, RuleEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleActionRepository, ruleConditionRepository, ruleRepository } from '../../@generic/drizzle/db/db';
import { hasDuplicateRuleConditions } from '../util/has-duplicate-rule-conditions.util';

class RuleService {
    async create(input: RuleCreateInputInterface): Promise<RuleEntityInterface> {
        if (isNotEmptyArray(input.conditions)) {
            const existingRules = await ruleRepository.findEnabledWithRelations();

            if (hasDuplicateRuleConditions(input.conditions, input.conditionMatchType, existingRules)) {
                throw new Error(t`A rule with the same conditions already exists`);
            }
        }

        const rule = await db.transaction(async tx => {
            const createdRule = await ruleRepository.create(
                {
                    enabled: input.enabled,
                    conditionMatchType: input.conditionMatchType
                },
                tx
            );

            if (isNotEmptyArray(input.conditions)) {
                await ruleConditionRepository.bulkCreate(
                    input.conditions.map(condition => ({ ...condition, ruleId: createdRule.id })),
                    tx
                );
            }

            if (isNotEmptyArray(input.actions)) {
                await ruleActionRepository.bulkCreate(
                    input.actions.map(action => ({ ...action, ruleId: createdRule.id })),
                    tx
                );
            }

            return createdRule;
        });

        return rule;
    }

    async updateById(id: number, input: RuleCreateInputInterface): Promise<RuleEntityInterface> {
        return db.transaction(async tx => {
            const updatedRule = await ruleRepository.updateById(
                id,
                {
                    enabled: input.enabled,
                    conditionMatchType: input.conditionMatchType
                },
                tx
            );

            if (isDefined(input.conditions)) {
                await ruleConditionRepository.deleteByRuleId(id, tx);
                if (isNotEmptyArray(input.conditions)) {
                    await ruleConditionRepository.bulkCreate(
                        input.conditions.map(condition => ({ ...condition, ruleId: id })),
                        tx
                    );
                }
            }

            if (isDefined(input.actions)) {
                await ruleActionRepository.deleteByRuleId(id, tx);
                if (isNotEmptyArray(input.actions)) {
                    await ruleActionRepository.bulkCreate(
                        input.actions.map(action => ({ ...action, ruleId: id })),
                        tx
                    );
                }
            }

            return updatedRule;
        });
    }
}

export const ruleService = new RuleService();
