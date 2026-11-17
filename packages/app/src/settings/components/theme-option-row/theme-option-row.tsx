import { ThemeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';

interface Props {
    readonly value: ThemeEnum;
    readonly label: string;
    readonly isSelected: boolean;
    readonly onSelect: (value: ThemeEnum) => void;
}

export const ThemeOptionRow = ({ value, label, isSelected, onSelect }: Props) => {
    const handlePress = () => void onSelect(value);
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            onPress={handlePress}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            accessibilityRole="radio"
            accessibilityState={accessibilityState}
            className="min-h-[44px] flex-row items-center gap-x-md py-xs active:opacity-70"
        >
            <Text className="flex-1 text-primary text-[17px]" maxFontSizeMultiplier={2}>
                {label}
            </Text>
            <View className="min-w-[22px] items-end">
                {isSelected ? <Icon icon={UserIconNameEnum.Check} size={22} className="text-positive-action" /> : null}
            </View>
        </HapticPressable>
    );
};
