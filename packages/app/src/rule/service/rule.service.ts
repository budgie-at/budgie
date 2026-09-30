import { Db, RuleActionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, ruleActionRepository, ruleConditionRepository, ruleRepository } from '../../@generic/drizzle/db/db';
import { assertTransferAccountsAreNotDebt } from '../../transaction/utils/assert-transfer-accounts-are-not-debt.util';

import type { RuleCreateInputInterface, RuleUpdateInputInterface } from '@budgie/contracts';

class RuleService {
    readonly toggleEnabled = Effect.fn('RuleService.toggleEnabled')(function* (id: number, enabled: boolean) {
        yield* ruleRepository.updateById(id, { enabled });
    });

    readonly archiveById = Effect.fn('RuleService.archiveById')(function* (id: number) {
        yield* ruleRepository.archiveById(id);
    });

    readonly create = Effect.fn('RuleService.create')(
        function* (this: RuleService, input: RuleCreateInputInterface) {
            yield* this.assertTransferActionsAreNotDebt(input.actions);

            const createdRule = yield* ruleRepository.create({
                enabled: input.enabled,
                conditionMatchType: input.conditionMatchType
            });

            if (isNotEmptyArray(input.conditions)) {
                yield* ruleConditionRepository.bulkCreate(input.conditions.map(condition => ({ ...condition, ruleId: createdRule.id })));
            }

            if (isNotEmptyArray(input.actions)) {
                yield* ruleActionRepository.bulkCreate(input.actions.map(action => ({ ...action, ruleId: createdRule.id })));
            }

            return createdRule;
        },
        effect => Db.transaction(effect)
    );

    readonly updateById = Effect.fn('RuleService.updateById')(
        function* (this: RuleService, id: number, input: RuleUpdateInputInterface) {
            const updatedRule = yield* this.updateRuleFields(id, input);

            yield* this.syncRuleConditions(id, input.conditions);
            yield* this.syncRuleActions(id, input.actions);

            return updatedRule;
        },
        effect => Db.transaction(effect)
    );

    private readonly updateRuleFields = Effect.fn('RuleService.updateRuleFields')(function* (id: number, input: RuleUpdateInputInterface) {
        const ruleFieldUpdate = {
            ...(isDefined(input.enabled) && { enabled: input.enabled }),
            ...(isDefined(input.conditionMatchType) && { conditionMatchType: input.conditionMatchType })
        };

        if (isNotEmptyArray(Object.keys(ruleFieldUpdate))) {
            return yield* ruleRepository.updateById(id, ruleFieldUpdate);
        }

        const existingRule = yield* Db.query(() => ruleRepository.findByIdWithRelations(id));
        if (!isDefined(existingRule)) {
            // oxlint-disable-next-line lingui/no-unlocalized-strings
            return yield* Effect.die(new Error(`Rule ${id} not found`));
        }

        return existingRule;
    });

    private readonly syncRuleConditions = Effect.fn('RuleService.syncRuleConditions')(function* (
        id: number,
        conditions: RuleUpdateInputInterface['conditions']
    ) {
        if (!isDefined(conditions)) {
            return;
        }
        yield* ruleConditionRepository.deleteByRuleId(id);
        if (isNotEmptyArray(conditions)) {
            yield* ruleConditionRepository.bulkCreate(conditions.map(condition => ({ ...condition, ruleId: id })));
        }
    });

    private readonly assertTransferActionsAreNotDebt = Effect.fn('RuleService.assertTransferActionsAreNotDebt')(function* (
        actions: RuleCreateInputInterface['actions']
    ) {
        const accountIds = actions
            .filter(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER)
            .map(action => action.accountId)
            .filter(isDefined);
        const accounts = yield* Effect.all(
            accountIds.map(accountId => Db.query(db => accountRepository.findById(accountId, db))),
            { concurrency: 'unbounded' }
        );

        yield* assertTransferAccountsAreNotDebt(accounts.filter(isDefined));
    });

    private readonly syncRuleActions = Effect.fn('RuleService.syncRuleActions')(function* (
        this: RuleService,
        id: number,
        actions: RuleUpdateInputInterface['actions']
    ) {
        if (!isDefined(actions)) {
            return;
        }

        yield* this.assertTransferActionsAreNotDebt(actions);
        yield* ruleActionRepository.deleteByRuleId(id);
        if (isNotEmptyArray(actions)) {
            yield* ruleActionRepository.bulkCreate(actions.map(action => ({ ...action, ruleId: id })));
        }
    });
}

export const ruleService = new RuleService();
