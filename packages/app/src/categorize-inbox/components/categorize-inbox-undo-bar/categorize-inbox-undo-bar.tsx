import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxRuleButton } from '../categorize-inbox-rule-button/categorize-inbox-rule-button';

import { CategorizeInboxUndoBarSelector } from './categorize-inbox-undo-bar.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignments: CategorizeInboxAssignmentInterface[];
    readonly onUndo: () => void;
}

export const CategorizeInboxUndoBar = ({ assignments, onUndo }: Props) => {
    const { t } = useLingui();
    const { categoriesById } = useCategorizeInboxContext();

    const [firstAssignment] = assignments;
    const groupCount = assignments.length;
    const isSingleAssignment = groupCount === 1;
    const category = isSingleAssignment ? (categoriesById.get(firstAssignment.categoryId) ?? null) : null;
    const ruleAssignment = isSingleAssignment && isNotEmptyString(firstAssignment.ruleConditionValue) ? firstAssignment : null;

    const rowCount = assignments.reduce((total, assignment) => total + assignment.transactionIds.length, 0);
    const { displayTitle } = firstAssignment;
    const categoryTitle = category?.title ?? '';
    const title = isDefined(category)
        ? t`Categorized ${displayTitle} → ${categoryTitle}`
        : t({ message: plural(rowCount, { one: 'Categorized # transaction', other: 'Categorized # transactions' }) });
    const description = isDefined(category)
        ? t({ message: plural(rowCount, { one: '# transaction', other: '# transactions' }) })
        : t({ message: plural(groupCount, { one: '# group', other: '# groups' }) });
    const icon = category?.icon ?? UserIconNameEnum.CheckCheck;

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

            {isDefined(ruleAssignment) ? <CategorizeInboxRuleButton assignment={ruleAssignment} /> : null}

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
