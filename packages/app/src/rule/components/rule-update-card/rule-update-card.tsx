import { RuleActionTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { UpdateRuleDataInterface } from '../../interface/update-rule-data.interface';
import { ruleApplicationDrainerService } from '../../service/rule-application-drainer.service';
import { ruleService } from '../../service/rule.service';
import { SwipeableRuleCard } from '../swipeable-rule-card/swipeable-rule-card';

interface Props {
    readonly updateRuleData: UpdateRuleDataInterface;
    readonly onRuleUpdated: () => void;
    readonly onDismiss: () => void;
}

const updateRule = async (updateRuleData: UpdateRuleDataInterface): Promise<void> => {
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

    ruleApplicationDrainerService.enqueueRuleApplication(updateRuleData.ruleId);
};

export const RuleUpdateCard = (props: Props) => {
    const { updateRuleData, onRuleUpdated, onDismiss } = props;

    const handleYes = async (): Promise<void> => updateRule(updateRuleData);

    return (
        <SwipeableRuleCard
            descriptionText={t`Update rule?`}
            successMessage={<Trans>Rule updated</Trans>}
            errorMessage={<Trans>Could not update rule</Trans>}
            onYes={handleYes}
            onComplete={onRuleUpdated}
            onDismiss={onDismiss}
        />
    );
};
