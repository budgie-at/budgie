import {
    RuleCreateInputInterface,
    RuleEntityInterface,
    RuleUpdateInputInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleActionRepository, ruleConditionRepository, ruleRepository } from '../../@generic/drizzle/db/db';

class RuleService {
    findAllWithRelations() {
        return ruleRepository.findAllWithRelations();
    }

    findEnabledWithRelations() {
        return ruleRepository.findEnabledWithRelations();
    }

    findByIdWithRelations(id: number) {
        return ruleRepository.findByIdWithRelations(id);
    }

    async create(input: RuleCreateInputInterface): Promise<RuleEntityInterface> {
        return db.transaction(async tx => {
            const rule = await ruleRepository.create(
                {
                    enabled: input.enabled,
                    conditionMatchType: input.conditionMatchType
                },
                tx
            );

            if (isNotEmptyArray(input.conditions)) {
                await ruleConditionRepository.bulkCreate(
                    input.conditions.map(condition => ({ ...condition, ruleId: rule.id })),
                    tx
                );
            }

            if (isNotEmptyArray(input.actions)) {
                await ruleActionRepository.bulkCreate(
                    input.actions.map(action => ({ ...action, ruleId: rule.id })),
                    tx
                );
            }

            return rule;
        });
    }

    async updateById(id: number, input: RuleUpdateInputInterface): Promise<RuleEntityInterface> {
        return db.transaction(async tx => {
            const rule = await ruleRepository.updateById(
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

            return rule;
        });
    }

    async deleteById(id: number): Promise<void> {
        await ruleRepository.deleteById(id);
    }

    async setEnabled(id: number, enabled: boolean): Promise<RuleEntityInterface> {
        return ruleRepository.updateById(id, { enabled });
    }
}

export const ruleService = new RuleService();
