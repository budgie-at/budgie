import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { StyleSheet, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetSelector } from '../../budget.selector';

interface Props {
    readonly onPress: () => void;
}

export const BudgetDetailsEditButton = ({ onPress }: Props) => (
    <HapticPressable
        accessible
        accessibilityLabel={t`Manage budget`}
        accessibilityRole="button"
        className="relative h-[40px] w-[40px]"
        collapsable={false}
        nativeID={BudgetSelector.DetailsEditButton}
        testID={BudgetSelector.DetailsEditButton}
        onPress={onPress}
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
