import { RuleConditionFieldEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
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
    const { categoriesById, isBusy, undo } = useCategorizeInboxContext();

    const [firstAssignment] = assignments;
    const categoryIds = new Set(assignments.map(assignment => assignment.categoryId));
    const [singleCategoryId] = categoryIds;
    const category = categoryIds.size === 1 && isDefined(singleCategoryId) ? (categoriesById.get(singleCategoryId) ?? null) : null;
    const ruleAssignment = assignments.length === 1 && isNotEmptyString(firstAssignment.ruleConditionValue) ? firstAssignment : null;

    const handleAlwaysPress = (): void => {
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
    const categoryTitle = category?.title ?? '';
    const label = isDefined(category)
        ? t`${rowCount} → ${categoryTitle}`
        : t({ message: plural(rowCount, { one: '# categorized', other: '# categorized' }) });
    const icon = category?.icon ?? UserIconNameEnum.CheckCheck;

    return (
        <Animated.View
            entering={FadeInDown.duration(200)}
            className="mx-5xl mb-xl flex-row items-center gap-x-md rounded-3xl bg-primary py-md pl-md pr-xl"
            testID={CategorizeInboxUndoBarSelector.Bar}
        >
            <CircleIcon icon={icon} variant="primary" size={32} iconSize={16} radius={16} border={false} />

            <Text className="text-primary-reverse text-sm font-medium flex-1" numberOfLines={1}>
                {label}
            </Text>

            {isDefined(ruleAssignment) ? (
                <HapticPressable
                    onPress={handleAlwaysPress}
                    accessibilityRole="button"
                    testID={CategorizeInboxUndoBarSelector.AlwaysButton}
                >
                    <Text className="text-primary-reverse/70 text-sm font-medium">
                        <Trans>Always</Trans>
                    </Text>
                </HapticPressable>
            ) : null}

            <HapticPressable onPress={undo} disabled={isBusy} accessibilityRole="button" testID={CategorizeInboxUndoBarSelector.UndoButton}>
                <Text className="text-primary-reverse text-sm font-semibold">
                    <Trans>Undo</Trans>
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
