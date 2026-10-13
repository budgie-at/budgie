import { AccountRepository, Db, RuleActionTypeEnum, RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { assertTransferAccountsAreNotDebt } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { RuleSuggestionDuplicateError } from '../error/rule-suggestion-duplicate.error';
import { RuleActionRepository } from '../repository/rule-action.repository';
import { RuleConditionRepository } from '../repository/rule-condition.repository';
import { RuleRepository } from '../repository/rule.repository';
import { buildCategoryTagActions } from '../utils/build-category-tag-actions.util';
import { selectSuggestConditions } from '../utils/select-suggest-condition.util';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { RuleCreateInputInterface, RuleUpdateInputInterface } from '@budgie/contracts';

export class RuleService extends Context.Service<RuleService>()('@budgie/rules/RuleService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;

        const ruleActionRepository = yield* RuleActionRepository;

        const ruleConditionRepository = yield* RuleConditionRepository;

        const ruleRepository = yield* RuleRepository;

        const toggleEnabled = (id: number, enabled: boolean) => Effect.asVoid(ruleRepository.updateById(id, { enabled }));

        const archiveById = (id: number) => Effect.asVoid(ruleRepository.archiveById(id));

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

        const serializeCondition = (condition: RuleConditionInputInterface) =>
            `${condition.field}|${condition.operator}|${condition.value.toLowerCase()}|${condition.secondaryValue?.toLowerCase() ?? ''}`;

        const serializeConditions = (conditions: readonly RuleConditionInputInterface[]) => conditions.map(serializeCondition).sort();

        const areConditionsEqual = (
            inputConditions: readonly RuleConditionInputInterface[],
            existingConditions: readonly RuleConditionInputInterface[]
        ) => {
            const inputKeys = serializeConditions(inputConditions);
            const existingKeys = serializeConditions(existingConditions);

            return inputKeys.length === existingKeys.length && inputKeys.every((key, index) => key === existingKeys[index]);
        };

        const buildSuggestionInput = Effect.fnUntraced(function* (suggestRuleData: SuggestRuleDataInterface) {
            const conditions = selectSuggestConditions(suggestRuleData.title, suggestRuleData.mccCode, suggestRuleData.comment);

            if (!isDefined(conditions)) {
                return yield* Effect.die(new Error('Invalid rule input'));
            }

            return {
                enabled: true,
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions,
                actions: buildCategoryTagActions(suggestRuleData.categoryId, suggestRuleData.tagIds)
            } satisfies RuleCreateInputInterface;
        });

        const createFromSuggestionAllowingDuplicate = Effect.fn('RuleService.createFromSuggestionAllowingDuplicate')(function* (
            suggestRuleData: SuggestRuleDataInterface
        ) {
            return yield* create(yield* buildSuggestionInput(suggestRuleData));
        });

        const createFromSuggestion = Effect.fn('RuleService.createFromSuggestion')(function* (suggestRuleData: SuggestRuleDataInterface) {
            const ruleInput = yield* buildSuggestionInput(suggestRuleData);
            const existingRules = yield* ruleRepository.findAllWithConditions();
            const duplicateRule = existingRules.find(
                rule =>
                    rule.conditionMatchType === ruleInput.conditionMatchType &&
                    isNotEmptyArray(rule.conditions) &&
                    areConditionsEqual(ruleInput.conditions, rule.conditions)
            );

            if (isDefined(duplicateRule)) {
                return yield* new RuleSuggestionDuplicateError({ ruleId: duplicateRule.id });
            }

            return yield* create(ruleInput);
        });

        const applySuggestedActions = Effect.fn('RuleService.applySuggestedActions')(function* (
            ruleId: number,
            categoryId: number | null,
            tagIds: readonly number[]
        ) {
            const existingRule = yield* ruleRepository.findByIdWithRelations(ruleId);

            if (!isDefined(existingRule)) {
                return yield* Effect.die(new Error('Rule not found'));
            }

            const preservedActions = existingRule.actions
                .filter(action => action.type !== RuleActionTypeEnum.SET_CATEGORY && action.type !== RuleActionTypeEnum.ADD_TAG)
                .map(action => ({
                    type: action.type,
                    categoryId: action.categoryId ?? null,
                    tagId: action.tagId ?? null,
                    accountId: action.accountId ?? null
                }));

            return yield* updateById(ruleId, { actions: [...preservedActions, ...buildCategoryTagActions(categoryId, tagIds)] });
        });

        return {
            toggleEnabled,
            archiveById,
            create,
            updateById,
            createFromSuggestion,
            createFromSuggestionAllowingDuplicate,
            applySuggestedActions
        };
    })
}) {
    static readonly layer = Layer.effect(RuleService, RuleService.make).pipe(
        Layer.provide([AccountRepository.layer, RuleActionRepository.layer, RuleConditionRepository.layer, RuleRepository.layer])
    );
}
