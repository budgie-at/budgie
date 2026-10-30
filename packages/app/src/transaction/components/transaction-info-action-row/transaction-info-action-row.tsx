import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const TransactionInfoActionRow = ({ label, onPress, testID }: Props) => (
    <HapticPressable
        className="min-h-[44px] justify-center px-3xl py-md active:scale-100 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}
    >
        <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
        <Text className="text-[17px] leading-[22px] text-default-foreground">{label}</Text>
    </HapticPressable>
);
