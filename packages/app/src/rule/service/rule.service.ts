import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleActionRepository, ruleConditionRepository, ruleRepository } from '../../@generic/drizzle/db/db';

import type { RuleCreateInputInterface, RuleEntityInterface, RuleUpdateInputInterface } from '@budgie/contracts';

class RuleService {
    @Log(
        (id, enabled) => `enter id=${id} enabled=${enabled}`,
        'done',
        (error, id, enabled) => `throw id=${id} enabled=${enabled} error=${getErrorMessage(error)}`
    )
    async toggleEnabled(id: number, enabled: boolean): Promise<void> {
        await ruleRepository.updateById(id, { enabled });
    }

    @Log(id => `enter id=${id}`, 'done', (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async archiveById(id: number): Promise<void> {
        await ruleRepository.archiveById(id);
    }

    @Log(
        input =>
            `enter conditionMatchType=${input.conditionMatchType} conditions=${input.conditions.length} actions=${input.actions.length}`,
        result => `done id=${result.id}`,
        (error, input) =>
            `throw conditionMatchType=${input.conditionMatchType} conditions=${input.conditions.length} actions=${input.actions.length} error=${getErrorMessage(error)}`
    )
    async create(input: RuleCreateInputInterface): Promise<RuleEntityInterface> {
        return transactionAsync(db, async tx => {
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
    }

    @Log(
        (id, input) =>
            `enter id=${id} conditions=${input.conditions?.length ?? 'unchanged'} actions=${input.actions?.length ?? 'unchanged'}`,
        (result, id) => `done id=${id} updatedId=${result.id}`,
        (error, id) => `throw id=${id} error=${getErrorMessage(error)}`
    )
    async updateById(id: number, input: RuleUpdateInputInterface): Promise<RuleEntityInterface> {
        return transactionAsync(db, async tx => {
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
