import { RuleActionTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { UpdateRuleDataInterface } from '../../interface/update-rule-data.interface';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';
import { SwipeableRuleCard, SwipeableRuleCardResultInterface } from '../swipeable-rule-card/swipeable-rule-card';

interface Props {
    readonly updateRuleData: UpdateRuleDataInterface;
    readonly onRuleUpdated: () => void;
    readonly onDismiss: () => void;
}

const updateRule = async (updateRuleData: UpdateRuleDataInterface): Promise<SwipeableRuleCardResultInterface> => {
    const allRules = await ruleRepository.findAllWithActionsAndCategories();
    const existingRule = allRules.find(rule => rule.id === updateRuleData.ruleId);

    if (!isDefined(existingRule)) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('Rule not found');
    }

    const preservedActions = existingRule.actions
        .filter(action => action.type !== RuleActionTypeEnum.SET_CATEGORY && action.type !== RuleActionTypeEnum.ADD_TAG)
        .map(action => ({
            type: action.type,
            categoryId: action.categoryId ?? null,
            tagId: action.tagId ?? null,
            accountId: action.accountId ?? null
        }));

    const categoryAction = isDefined(updateRuleData.categoryId)
        ? [{ type: RuleActionTypeEnum.SET_CATEGORY as const, categoryId: updateRuleData.categoryId, tagId: null, accountId: null }]
        : [];

    const tagActions = updateRuleData.tagIds.map(tagId => ({
        type: RuleActionTypeEnum.ADD_TAG as const,
        categoryId: null,
        tagId,
        accountId: null
    }));

    const mergedActions = [...preservedActions, ...categoryAction, ...tagActions];

    await ruleService.updateById(updateRuleData.ruleId, { actions: mergedActions });

    const result = await ruleEngineService.applyRuleToMatchingTransactions(updateRuleData.ruleId);

    return { applied: result.applied };
};

export const RuleUpdateCard = (props: Props) => {
    const { updateRuleData, onRuleUpdated, onDismiss } = props;

    const handleYes = async (): Promise<SwipeableRuleCardResultInterface> => await updateRule(updateRuleData);

    const successMessage = (appliedCount: number) => <Trans>Rule updated &middot; Applied to {appliedCount} transactions</Trans>;

    return (
        <SwipeableRuleCard
            descriptionText={t`Update rule?`}
            successMessage={successMessage}
            errorMessage={<Trans>Could not update rule</Trans>}
            layout="wide"
            onYes={handleYes}
            onComplete={onRuleUpdated}
            onDismiss={onDismiss}
        />
    );
};
