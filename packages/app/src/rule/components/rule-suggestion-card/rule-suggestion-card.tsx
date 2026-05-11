import {
    RuleActionTypeEnum,
    RuleConditionMatchTypeEnum,
    RuleCreateInputInterface,
    RuleWithRelationsEntityInterface
} from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Alert } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { RuleConditionInputInterface } from '../../interface/rule-condition-input.interface';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';
import { selectSuggestCondition } from '../../util/select-suggest-condition.util';
import { SwipeableRuleCard, SwipeableRuleCardResultInterface } from '../swipeable-rule-card/swipeable-rule-card';

const serializeCondition = (condition: RuleConditionInputInterface): string =>
    `${condition.field}|${condition.operator}|${condition.value.toLowerCase()}|${condition.secondaryValue?.toLowerCase() ?? ''}`;

const areConditionsEqual = (inputConditions: RuleConditionInputInterface[], existingConditions: RuleConditionInputInterface[]): boolean => {
    if (inputConditions.length !== existingConditions.length) {
        return false;
    }

    const inputKeys = inputConditions.map(serializeCondition).sort();
    const existingKeys = existingConditions.map(serializeCondition).sort();

    return inputKeys.every((key, index) => key === existingKeys[index]);
};

const findDuplicateRule = (
    conditions: RuleConditionInputInterface[],
    conditionMatchType: RuleConditionMatchTypeEnum,
    existingRules: RuleWithRelationsEntityInterface[]
): RuleWithRelationsEntityInterface | undefined =>
    existingRules.find(
        rule =>
            rule.conditionMatchType === conditionMatchType &&
            isNotEmptyArray(rule.conditions) &&
            areConditionsEqual(conditions, rule.conditions)
    );

const buildRuleCreateInput = (suggestRuleData: SuggestRuleDataInterface): RuleCreateInputInterface | null => {
    const condition = selectSuggestCondition(suggestRuleData.title, suggestRuleData.mccCode, suggestRuleData.comment);

    if (!isDefined(condition)) {
        return null;
    }

    const categoryAction = isDefined(suggestRuleData.categoryId)
        ? [{ type: RuleActionTypeEnum.SET_CATEGORY as const, categoryId: suggestRuleData.categoryId, tagId: null, accountId: null }]
        : [];

    const tagActions = suggestRuleData.tagIds.map(tagId => ({
        type: RuleActionTypeEnum.ADD_TAG as const,
        categoryId: null,
        tagId,
        accountId: null
    }));

    return {
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [condition],
        actions: [...categoryAction, ...tagActions]
    };
};

import { RuleSuggestionCardSelector } from './rule-suggestion-card.selector';

const logger = getLogger('RuleSuggestionCard');

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
}

const createRule = async (ruleInput: RuleCreateInputInterface): Promise<SwipeableRuleCardResultInterface> => {
    logger.log('createRule:enter', {
        conditionsCount: ruleInput.conditions.length,
        actionsCount: ruleInput.actions.length,
        conditionMatchType: ruleInput.conditionMatchType
    });
    const rule = await ruleService.create(ruleInput);
    logger.log('createRule:created', { ruleId: rule.id });
    const result = await ruleEngineService.applyRuleToMatchingTransactions(rule.id, null);
    logger.log('createRule:applied', { ruleId: rule.id, applied: result.applied, failed: result.failed, total: result.total });

    return { applied: result.applied };
};

export const RuleSuggestionCard = (props: Props) => {
    const { suggestRuleData, onRuleCreated, onDismiss } = props;
    const { openRuleForm } = useRuleFormModal();

    const handleYes = async (): Promise<SwipeableRuleCardResultInterface> => {
        logger.log('handleYes:enter', {
            title: suggestRuleData.title,
            mccCode: suggestRuleData.mccCode,
            categoryId: suggestRuleData.categoryId,
            tagIds: suggestRuleData.tagIds.join(',')
        });
        const ruleInput = buildRuleCreateInput(suggestRuleData);
        logger.log('handleYes:buildRuleCreateInput', { hasInput: isDefined(ruleInput) });

        if (!isDefined(ruleInput)) {
            logger.error('handleYes:throw:invalid-input');
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Invalid rule input');
        }

        const existingRules = await ruleRepository.findAllWithActionsAndCategories();
        const duplicateRule = findDuplicateRule(ruleInput.conditions, ruleInput.conditionMatchType, existingRules);
        logger.log('handleYes:duplicate-check', {
            existingRulesCount: existingRules.length,
            duplicateRuleId: duplicateRule?.id ?? null
        });

        if (isDefined(duplicateRule)) {
            logger.log('handleYes:duplicate-alert:shown', { duplicateRuleId: duplicateRule.id });

            return await new Promise<SwipeableRuleCardResultInterface>((resolve, reject) => {
                const handleEditExisting = () => {
                    logger.log('handleYes:duplicate-alert:edit', { duplicateRuleId: duplicateRule.id });
                    void openRuleForm({ ruleId: duplicateRule.id });
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    reject(new Error('Edit'));
                };

                const handleCancel = () => {
                    logger.log('handleYes:duplicate-alert:cancel');
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    reject(new Error('Cancelled'));
                };

                const onCreateAnywaySuccess = (result: SwipeableRuleCardResultInterface): SwipeableRuleCardResultInterface => {
                    onRuleCreated();
                    resolve(result);

                    return result;
                };

                const handleCreateAnyway = () => {
                    logger.log('handleYes:duplicate-alert:create-anyway');
                    void createRule(ruleInput).then(onCreateAnywaySuccess, reject);
                };

                Alert.alert(t`Duplicate rule`, t`A rule with the same conditions already exists.`, [
                    { text: t`Cancel`, style: 'cancel', onPress: handleCancel },
                    { text: t`Edit existing`, onPress: handleEditExisting },
                    { text: t`Create anyway`, onPress: handleCreateAnyway }
                ]);
            });
        }

        const result = await createRule(ruleInput);
        onRuleCreated();

        return result;
    };

    const successMessage = (appliedCount: number) => <Trans>Rule created &middot; Applied to {appliedCount} transactions</Trans>;

    return (
        <SwipeableRuleCard
            descriptionText={t`Quick rule`}
            successMessage={successMessage}
            errorMessage={<Trans>Could not create rule</Trans>}
            cardTestID={RuleSuggestionCardSelector.Card}
            buttonTestID={RuleSuggestionCardSelector.CreateRuleButton}
            onYes={handleYes}
            onComplete={onRuleCreated}
            onDismiss={onDismiss}
        />
    );
};
