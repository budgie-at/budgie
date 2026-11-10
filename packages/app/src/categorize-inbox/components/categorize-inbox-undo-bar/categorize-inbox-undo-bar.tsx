import { buildRulePrefillActions } from '@budgie/categorization';
import { RuleConditionFieldEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { toCategorizeInboxTransactionIds } from '../../utils/to-categorize-inbox-transaction-ids.util';
import { CategorizeInboxFollowUpButton } from '../categorize-inbox-follow-up-button/categorize-inbox-follow-up-button';
import { CategorizeInboxUndoLayout } from '../categorize-inbox-undo-layout/categorize-inbox-undo-layout';

import { CategorizeInboxUndoBarSelector } from './categorize-inbox-undo-bar.selector';

import type { CategorizeInboxLabelInterface } from '../../interface/categorize-inbox-label.interface';

const resolveUndoBarTitle = (labels: CategorizeInboxLabelInterface[], filedLabel: string, tagsLabel: string): string => {
    if (labels.length === 1) {
        return labels[0].title;
    }
    if (isNotEmptyArray(labels)) {
        return tagsLabel;
    }

    return filedLabel;
};

export const CategorizeInboxUndoBar = () => {
    const { t } = useLingui();
    const { strategy, lastWrite, lastWriteState, undo } = useCategorizeInboxContext();
    const openRuleForm = useOpenModal('/rule-form');

    if (!isDefined(lastWrite) || !isDefined(strategy)) {
        return null;
    }

    const { assignments } = lastWrite;
    const [{ ruleConditionValue }] = assignments;
    const groupCount = new Set(assignments.map(assignment => assignment.key)).size;
    const rowCount = new Set(toCategorizeInboxTransactionIds(assignments)).size;
    const labels = groupCount === 1 ? assignments.map(assignment => strategy.labelsById.get(assignment.labelId)).filter(isDefined) : [];
    const title = resolveUndoBarTitle(
        labels,
        t({ message: plural(rowCount, { one: 'Filed # payment', other: 'Filed # payments' }) }),
        t({ message: plural(labels.length, { one: '# tag', other: '# tags' }) })
    );
    const description =
        groupCount === 1
            ? t({ message: plural(rowCount, { one: '# payment', other: '# payments' }) })
            : t({ message: plural(groupCount, { one: '# group', other: '# groups' }) });

    const handleUndoPress = (): void => void undo(lastWrite);
    const handleRulePress = (): void => {
        const ruleActions = strategy.buildRuleActions(labels.map(label => label.id));
        const followUpTagIds = lastWrite.followUpAssignments.map(assignment => assignment.labelId);
        const prefillActions = buildRulePrefillActions(ruleActions.categoryId, ruleActions.tagIds, assignments[0].rows, followUpTagIds);

        openRuleForm({
            prefillData: {
                conditions: [
                    { field: RuleConditionFieldEnum.TITLE, operator: RuleConditionOperatorEnum.CONTAINS, value: ruleConditionValue }
                ],
                ...prefillActions
            }
        });
    };

    return (
        <CategorizeInboxUndoLayout title={title} description={description} onUndo={handleUndoPress}>
            {groupCount === 1 ? <CategorizeInboxFollowUpButton lastWrite={lastWrite} /> : null}

            {isNotEmptyArray(labels) && isNotEmptyString(ruleConditionValue) && !lastWriteState.isRuleCovered ? (
                <HapticPressable
                    onPress={handleRulePress}
                    className="h-11 w-11 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={t`Create a rule`}
                    testID={CategorizeInboxUndoBarSelector.RuleButton}
                >
                    <Icon icon={UserIconNameEnum.Zap} size={18} className="text-secondary-foreground" />
                </HapticPressable>
            ) : null}
        </CategorizeInboxUndoLayout>
    );
};
