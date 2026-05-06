import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleActionRepository, ruleConditionRepository, ruleRepository } from '../../@generic/drizzle/db/db';

import type { DB, RuleCreateInputInterface, RuleEntityInterface, RuleUpdateInputInterface } from '@budgie/contracts';

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
            const updatedRule = await this.updateRuleFields(id, input, tx);

            await this.syncRuleConditions(id, input.conditions, tx);
            await this.syncRuleActions(id, input.actions, tx);

            return updatedRule;
        });
    }

    private async updateRuleFields(id: number, input: RuleUpdateInputInterface, tx: DB): Promise<RuleEntityInterface> {
        const ruleFieldUpdate = {
            ...(isDefined(input.enabled) && { enabled: input.enabled }),
            ...(isDefined(input.conditionMatchType) && { conditionMatchType: input.conditionMatchType })
        };

        if (isNotEmptyArray(Object.keys(ruleFieldUpdate))) {
            return ruleRepository.updateById(id, ruleFieldUpdate, tx);
        }

        const existingRule = await ruleRepository.findByIdWithRelations(id);
        if (!isDefined(existingRule)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error(`Rule ${id} not found`);
        }

        return existingRule;
    }

    private async syncRuleConditions(id: number, conditions: RuleUpdateInputInterface['conditions'], tx: DB): Promise<void> {
        if (!isDefined(conditions)) {
            return;
        }
        await ruleConditionRepository.deleteByRuleId(id, tx);
        if (isNotEmptyArray(conditions)) {
            await ruleConditionRepository.bulkCreate(
                conditions.map(condition => ({ ...condition, ruleId: id })),
                tx
            );
        }
    }

    private async syncRuleActions(id: number, actions: RuleUpdateInputInterface['actions'], tx: DB): Promise<void> {
        if (!isDefined(actions)) {
            return;
        }
        await ruleActionRepository.deleteByRuleId(id, tx);
        if (isNotEmptyArray(actions)) {
            await ruleActionRepository.bulkCreate(
                actions.map(action => ({ ...action, ruleId: id })),
                tx
            );
        }
    }
}

export const ruleService = new RuleService();
