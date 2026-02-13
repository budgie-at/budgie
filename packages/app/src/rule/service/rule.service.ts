import { RuleCreateInputInterface, RuleEntityInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleActionRepository, ruleConditionRepository, ruleRepository } from '../../@generic/drizzle/db/db';

class RuleService {
    async create(input: RuleCreateInputInterface): Promise<RuleEntityInterface> {
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
