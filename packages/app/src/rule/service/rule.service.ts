import {
    AccountRepository,
    Db,
    RuleActionRepository,
    RuleActionTypeEnum,
    RuleConditionRepository,
    RuleRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { assertTransferAccountsAreNotDebt } from '../../transaction/utils/assert-transfer-accounts-are-not-debt.util';

import type { RuleCreateInputInterface, RuleUpdateInputInterface } from '@budgie/contracts';

export class RuleService extends Context.Service<RuleService>()('@budgie/app/RuleService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;

        const ruleActionRepository = yield* RuleActionRepository;

        const ruleConditionRepository = yield* RuleConditionRepository;

        const ruleRepository = yield* RuleRepository;

        const toggleEnabled = Effect.fn('RuleService.toggleEnabled')(function* (id: number, enabled: boolean) {
            yield* ruleRepository.updateById(id, { enabled });
        });

        const archiveById = Effect.fn('RuleService.archiveById')(function* (id: number) {
            yield* ruleRepository.archiveById(id);
        });

        const assertTransferActionsAreNotDebt = Effect.fn('RuleService.assertTransferActionsAreNotDebt')(function* (
            actions: RuleCreateInputInterface['actions']
        ) {
            const accountIds = actions
                .filter(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER)
                .map(action => action.accountId)
                .filter(isDefined);
            const accounts = yield* Effect.all(
                accountIds.map(accountId => accountRepository.findById(accountId)),
                { concurrency: 'unbounded' }
            );

            yield* assertTransferAccountsAreNotDebt(accounts.filter(isDefined));
        });

        const create = Effect.fn('RuleService.create')(
            function* (input: RuleCreateInputInterface) {
                yield* assertTransferActionsAreNotDebt(input.actions);

                const createdRule = yield* ruleRepository.create({
                    enabled: input.enabled,
                    conditionMatchType: input.conditionMatchType
                });

                if (isNotEmptyArray(input.conditions)) {
                    yield* ruleConditionRepository.bulkCreate(
                        input.conditions.map(condition => ({ ...condition, ruleId: createdRule.id }))
                    );
                }

                if (isNotEmptyArray(input.actions)) {
                    yield* ruleActionRepository.bulkCreate(input.actions.map(action => ({ ...action, ruleId: createdRule.id })));
                }

                return createdRule;
            },
            effect => Db.transaction(effect)
        );

        const updateRuleFields = Effect.fn('RuleService.updateRuleFields')(function* (id: number, input: RuleUpdateInputInterface) {
            const ruleFieldUpdate = {
                ...(isDefined(input.enabled) && { enabled: input.enabled }),
                ...(isDefined(input.conditionMatchType) && { conditionMatchType: input.conditionMatchType })
            };

            if (isNotEmptyArray(Object.keys(ruleFieldUpdate))) {
                return yield* ruleRepository.updateById(id, ruleFieldUpdate);
            }

            const existingRule = yield* ruleRepository.findByIdWithRelations(id);
            if (!isDefined(existingRule)) {
                // oxlint-disable-next-line lingui/no-unlocalized-strings
                return yield* Effect.die(new Error(`Rule ${id} not found`));
            }

            return existingRule;
        });

        const syncRuleConditions = Effect.fn('RuleService.syncRuleConditions')(function* (
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

        const syncRuleActions = Effect.fn('RuleService.syncRuleActions')(function* (
            id: number,
            actions: RuleUpdateInputInterface['actions']
        ) {
            if (!isDefined(actions)) {
                return;
            }

            yield* assertTransferActionsAreNotDebt(actions);
            yield* ruleActionRepository.deleteByRuleId(id);
            if (isNotEmptyArray(actions)) {
                yield* ruleActionRepository.bulkCreate(actions.map(action => ({ ...action, ruleId: id })));
            }
        });

        const updateById = Effect.fn('RuleService.updateById')(
            function* (id: number, input: RuleUpdateInputInterface) {
                const updatedRule = yield* updateRuleFields(id, input);

                yield* syncRuleConditions(id, input.conditions);
                yield* syncRuleActions(id, input.actions);

                return updatedRule;
            },
            effect => Db.transaction(effect)
        );

        return { toggleEnabled, archiveById, create, updateById };
    })
}) {
    static readonly layer = Layer.effect(RuleService, RuleService.make).pipe(
        Layer.provide([AccountRepository.layer, RuleActionRepository.layer, RuleConditionRepository.layer, RuleRepository.layer])
    );
}
