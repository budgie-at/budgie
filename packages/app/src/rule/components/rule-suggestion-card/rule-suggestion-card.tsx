import { RuleActionTypeEnum, RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Alert } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';
import { findDuplicateRule } from '../../util/find-duplicate-rule.util';
import { selectSuggestCondition } from '../../util/select-suggest-condition.util';
import { SwipeableRuleCard, SwipeableRuleCardResultInterface } from '../swipeable-rule-card/swipeable-rule-card';

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
}

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
        actions: [...categoryAction, ...tagActions],
        applyToExisting: false
    };
};

const createRule = async (ruleInput: RuleCreateInputInterface): Promise<SwipeableRuleCardResultInterface> => {
    const rule = await ruleService.create(ruleInput);
    const result = await ruleEngineService.applyRuleToMatchingTransactions(rule.id);

    return { applied: result.applied };
};

export const RuleSuggestionCard = (props: Props) => {
    const { suggestRuleData, onRuleCreated, onDismiss } = props;
    const { openRuleForm } = useRuleFormModal();

    const handleYes = async (): Promise<SwipeableRuleCardResultInterface> => {
        const ruleInput = buildRuleCreateInput(suggestRuleData);

        if (!isDefined(ruleInput)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Invalid rule input');
        }

        const existingRules = await ruleRepository.findAllWithActionsAndCategories();
        const duplicateRule = findDuplicateRule(ruleInput.conditions, ruleInput.conditionMatchType, existingRules);

        if (isDefined(duplicateRule)) {
            return await new Promise<SwipeableRuleCardResultInterface>((resolve, reject) => {
                const handleEditExisting = () => {
                    void openRuleForm({ ruleId: duplicateRule.id });
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    reject(new Error('Edit'));
                };

                Alert.alert(t`Duplicate rule`, t`A rule with the same conditions already exists.`, [
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    { text: t`Cancel`, style: 'cancel', onPress: () => void reject(new Error('Cancelled')) },
                    { text: t`Edit existing`, onPress: handleEditExisting },
                    { text: t`Create anyway`, onPress: () => void createRule(ruleInput).then(resolve, reject) }
                ]);
            });
        }

        return await createRule(ruleInput);
    };

    const successMessage = (appliedCount: number) => <Trans>Rule created &middot; Applied to {appliedCount} transactions</Trans>;

    return (
        <SwipeableRuleCard
            descriptionText={t`Quick rule`}
            successMessage={successMessage}
            errorMessage={<Trans>Could not create rule</Trans>}
            cardTestID={SuggestRuleSelectors.Card}
            buttonTestID={SuggestRuleSelectors.CreateRuleButton}
            onYes={handleYes}
            onComplete={onRuleCreated}
            onDismiss={onDismiss}
        />
    );
};
