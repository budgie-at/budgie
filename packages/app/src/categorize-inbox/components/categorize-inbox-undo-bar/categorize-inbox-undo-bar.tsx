import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxStrategy } from '../../context/categorize-inbox-strategy.context';
import { CategorizeInboxFollowUpButton } from '../categorize-inbox-follow-up-button/categorize-inbox-follow-up-button';
import { CategorizeInboxRuleButton } from '../categorize-inbox-rule-button/categorize-inbox-rule-button';

import { CategorizeInboxUndoBarSelector } from './categorize-inbox-undo-bar.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignments: CategorizeInboxAssignmentInterface[];
    readonly onUndo: () => void;
}

export const CategorizeInboxUndoBar = ({ assignments, onUndo }: Props) => {
    const { t } = useLingui();
    const { labelsById, copy } = useCategorizeInboxStrategy();

    const [firstAssignment] = assignments;
    const groupCount = new Set(assignments.map(assignment => assignment.clusterKey)).size;
    const isSingleGroup = groupCount === 1;
    const labelIds = isSingleGroup ? [...new Set(assignments.map(assignment => assignment.labelId))] : [];
    const labels = labelIds.map(labelId => labelsById.get(labelId)).filter(isDefined);
    const firstLabel = labels.at(0);
    const hasRule = isNotEmptyArray(labels) && isNotEmptyString(firstAssignment.ruleConditionValue);

    const rowCount = new Set(assignments.flatMap(assignment => assignment.transactionIds)).size;
    const title = isDefined(firstLabel)
        ? copy.assignedTo(firstAssignment.displayTitle, labels.map(label => label.title).join(', '))
        : copy.assignedCount(rowCount);
    const description = isDefined(firstLabel)
        ? t({ message: plural(rowCount, { one: '# transaction', other: '# transactions' }) })
        : t({ message: plural(groupCount, { one: '# group', other: '# groups' }) });
    const icon = firstLabel?.icon ?? UserIconNameEnum.CheckCheck;

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            className="h-14 flex-row items-center gap-x-lg rounded-5xl border border-secondary-corner bg-primary-reverse pl-md"
            accessibilityLiveRegion="polite"
            testID={CategorizeInboxUndoBarSelector.Bar}
        >
            <CircleIcon icon={icon} variant="ghost" size={36} iconSize={20} border={false} />

            <View className="flex-1" accessible accessibilityLabel={[title, description].join(', ')}>
                <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="mt-xxs text-xs font-medium text-secondary-foreground" numberOfLines={1}>
                    {description}
                </Text>
            </View>

            {isSingleGroup ? <CategorizeInboxFollowUpButton assignment={firstAssignment} /> : null}

            {hasRule ? <CategorizeInboxRuleButton ruleConditionValue={firstAssignment.ruleConditionValue} labelIds={labelIds} /> : null}

            <HapticPressable
                onPress={onUndo}
                className="h-11 justify-center pr-xl pl-md"
                accessibilityRole="button"
                testID={CategorizeInboxUndoBarSelector.UndoButton}
            >
                <Text className="text-sm font-semibold text-primary">
                    <Trans>Undo</Trans>
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
