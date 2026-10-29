import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetSelector } from '../../budget.selector';

interface Props {
    readonly budgetId: number;
}

export const BudgetDetailsEditButton = ({ budgetId }: Props) => {
    const handlePress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budgetId) } });
    };

    return (
        <HapticPressable
            accessible
            accessibilityLabel={t`Manage budget`}
            accessibilityRole="button"
            className="relative h-[40px] w-[40px]"
            collapsable={false}
            nativeID={BudgetSelector.DetailsEditButton}
            testID={BudgetSelector.DetailsEditButton}
            onPress={handlePress}
        >
            <View
                collapsable={false}
                nativeID={BudgetSelector.DetailsEditButton}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={BudgetSelector.DetailsEditButton}
            />
            <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
        </HapticPressable>
    );
};
