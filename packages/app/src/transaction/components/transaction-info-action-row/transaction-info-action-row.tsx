import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const TransactionInfoActionRow = ({ label, onPress, testID, icon }: Props) => (
    <HapticPressable
        className="min-h-[48px] flex-row items-center gap-x-xl px-3xl py-md active:scale-100 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}
    >
        <View className="absolute top-0 right-0 left-[56px] h-hairline bg-surface-separator" pointerEvents="none" />
        <Icon icon={icon} size={22} className="text-default-foreground" />
        <Text className="flex-1 text-[17px] leading-[22px] text-default-foreground">{label}</Text>
    </HapticPressable>
);
