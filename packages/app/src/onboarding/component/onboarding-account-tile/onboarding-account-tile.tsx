import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { OnboardingAccountOptionInterface } from '../../interface/onboarding-account-option.interface';

interface Props {
    readonly option: OnboardingAccountOptionInterface;
    readonly isSelected: boolean;
    readonly onToggle: (type: AccountTypeEnum) => void;
    readonly testID: string;
}

export const OnboardingAccountTile = ({ option, isSelected, onToggle, testID }: Props) => {
    const handlePress = () => void onToggle(option.type);

    const accessibilityState = { checked: isSelected };
    const selectionClassName = isSelected
        ? 'border-2 border-primary bg-secondary-background p-[13px]'
        : 'border border-secondary-corner p-2xl';

    return (
        <HapticPressable
            testID={testID}
            onPress={handlePress}
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            className={cn('grow basis-[40%] gap-y-lg rounded-[20px] active:scale-xs', selectionClassName)}
        >
            <Icon icon={option.icon} size={22} className="text-primary" />

            <Text className="text-primary text-md font-medium">{option.title}</Text>

            {isSelected ? (
                <View className="absolute right-lg top-lg size-[22px] items-center justify-center rounded-full bg-primary">
                    <Icon icon={UserIconNameEnum.Check} size={14} className="text-primary-reverse" />
                </View>
            ) : null}
        </HapticPressable>
    );
};
