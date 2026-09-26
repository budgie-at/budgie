import { RuleConditionFieldEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useRuleFormModal } from '../../../rule/context/rule-form-modal.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxUndoBarSelector } from './categorize-inbox-undo-bar.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignments: CategorizeInboxAssignmentInterface[];
}

export const CategorizeInboxUndoBar = ({ assignments }: Props) => {
    const { t } = useLingui();
    const { openRuleForm } = useRuleFormModal();
    const { categoriesById, undo } = useCategorizeInboxContext();

    const [firstAssignment] = assignments;
    const categoryIds = new Set(assignments.map(assignment => assignment.categoryId));
    const [singleCategoryId] = categoryIds;
    const category = categoryIds.size === 1 && isDefined(singleCategoryId) ? (categoriesById.get(singleCategoryId) ?? null) : null;
    const ruleAssignment = assignments.length === 1 && isNotEmptyString(firstAssignment.ruleConditionValue) ? firstAssignment : null;

    const handleRulePress = (): void => {
        if (isDefined(ruleAssignment)) {
            void openRuleForm({
                prefillData: {
                    conditions: [
                        {
                            field: RuleConditionFieldEnum.TITLE,
                            operator: RuleConditionOperatorEnum.CONTAINS,
                            value: ruleAssignment.ruleConditionValue
                        }
                    ],
                    categoryId: ruleAssignment.categoryId,
                    tagIds: []
                }
            });
        }
    };

    const rowCount = assignments.reduce((total, assignment) => total + assignment.transactionIds.length, 0);
    const title = category?.title ?? t({ message: plural(rowCount, { one: '# categorized', other: '# categorized' }) });
    const description = isDefined(category)
        ? t({ message: plural(rowCount, { one: '# transaction', other: '# transactions' }) })
        : t({ message: plural(categoryIds.size, { one: '# category', other: '# categories' }) });
    const icon = category?.icon ?? UserIconNameEnum.CheckCheck;

    return (
        <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(150)}
            className="flex-row items-center gap-x-lg rounded-5xl border border-secondary-corner bg-primary-reverse p-lg"
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

            {isDefined(ruleAssignment) ? (
                <HapticPressable
                    onPress={handleRulePress}
                    className="h-10 w-10 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={t`Create a rule`}
                    testID={CategorizeInboxUndoBarSelector.RuleButton}
                >
                    <Icon icon={UserIconNameEnum.Zap} size={18} className="text-secondary-foreground" />
                </HapticPressable>
            ) : null}

            <HapticPressable
                onPress={undo}
                className="h-10 justify-center px-md"
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
