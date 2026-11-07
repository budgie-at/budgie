import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import type { OnboardingAccountOptionInterface } from '../../interface/onboarding-account-option.interface';

interface Props {
    readonly option: OnboardingAccountOptionInterface;
    readonly isSelected: boolean;
    readonly isLocked: boolean;
    readonly onToggle: (type: AccountTypeEnum) => void;
    readonly testID: string;
}

export const OnboardingAccountRow = ({ option, isSelected, isLocked, onToggle, testID }: Props) => {
    const handlePress = () => void onToggle(option.type);

    const accessibilityState = { checked: isSelected, disabled: isLocked };
    const indicator = isSelected ? (
        <View className="size-[24px] items-center justify-center rounded-full bg-primary">
            <Icon icon={UserIconNameEnum.Check} size={14} className="text-primary-reverse" />
        </View>
    ) : (
        <View className="size-[24px] rounded-full border-[1.5px] border-secondary-foreground" />
    );

    return (
        <HapticPressable
            testID={testID}
            onPress={handlePress}
            disabled={isLocked}
            accessibilityRole="checkbox"
            accessibilityLabel={option.title}
            accessibilityState={accessibilityState}
            className="active:opacity-70"
        >
            <GroupedListRow
                left={<GroupedListIcon icon={option.icon} />}
                title={<Text className="text-primary text-[17px]">{option.title}</Text>}
                right={indicator}
            />
        </HapticPressable>
    );
};
