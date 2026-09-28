import { RuleConditionFieldEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useRuleFormModal } from '../../../rule/context/rule-form-modal.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxFollowUpButton } from '../categorize-inbox-follow-up-button/categorize-inbox-follow-up-button';

import { CategorizeInboxUndoBarSelector } from './categorize-inbox-undo-bar.selector';

import type { CategorizeInboxLabelInterface } from '../../interface/categorize-inbox-label.interface';
import type { CategorizeInboxLastWriteInterface } from '../../interface/categorize-inbox-last-write.interface';

interface Props {
    readonly lastWrite: CategorizeInboxLastWriteInterface;
    readonly onUndo: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly onFollowUp: (lastWrite: CategorizeInboxLastWriteInterface) => Promise<void>;
}

const resolveUndoBarTitle = (
    labels: CategorizeInboxLabelInterface[],
    rowCount: number,
    assignedCount: (count: number) => string,
    tagsLabel: string
): string => {
    if (labels.length === 1) {
        return labels[0].title;
    }
    if (isNotEmptyArray(labels)) {
        return tagsLabel;
    }

    return assignedCount(rowCount);
};

export const CategorizeInboxUndoBar = ({ lastWrite, onUndo, onFollowUp }: Props) => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();
    const [openRuleForm] = useRuleFormModal();

    const { assignments } = lastWrite;
    const [{ ruleConditionValue }] = assignments;
    const groupCount = new Set(assignments.map(assignment => assignment.key)).size;
    const rowCount = new Set(assignments.flatMap(assignment => assignment.rows.map(row => row.transactionId))).size;
    const labels = groupCount === 1 ? assignments.map(assignment => strategy.labelsById.get(assignment.labelId)).filter(isDefined) : [];
    const firstLabel = labels.at(0);
    const icon = firstLabel?.icon ?? UserIconNameEnum.CheckCheck;
    const title = resolveUndoBarTitle(
        labels,
        rowCount,
        strategy.assignedCount,
        t({ message: plural(labels.length, { one: '# tag', other: '# tags' }) })
    );
    const description = t({ message: plural(rowCount, { one: '# transaction', other: '# transactions' }) });

    const handleUndoPress = (): void => void onUndo(lastWrite);
    const handleRulePress = (): void =>
        void openRuleForm({
            prefillData: {
                conditions: [
                    { field: RuleConditionFieldEnum.TITLE, operator: RuleConditionOperatorEnum.CONTAINS, value: ruleConditionValue }
                ],
                ...strategy.buildRuleActions(labels.map(label => label.id))
            }
        });

    return (
        <View
            className="h-14 flex-row items-center gap-x-lg rounded-5xl border border-secondary-corner bg-primary-reverse pl-md"
            accessibilityLiveRegion="polite"
            testID={CategorizeInboxUndoBarSelector.Bar}
        >
            <CircleIcon icon={icon} variant="ghost" size={36} iconSize={20} border={false} />

            <View className="flex-1" accessible>
                <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="mt-xxs text-xs font-medium text-secondary-foreground" numberOfLines={1}>
                    {description}
                </Text>
            </View>

            {groupCount === 1 ? <CategorizeInboxFollowUpButton lastWrite={lastWrite} onFollowUp={onFollowUp} /> : null}

            {isDefined(firstLabel) && isNotEmptyString(ruleConditionValue) ? (
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

            <HapticPressable
                onPress={handleUndoPress}
                className="h-11 justify-center pr-xl pl-md"
                accessibilityRole="button"
                testID={CategorizeInboxUndoBarSelector.UndoButton}
            >
                <Text className="text-sm font-semibold text-primary">
                    <Trans>Undo</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
