import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly title: string;
    readonly closeLabel: string;
    readonly onClose: () => void;
    readonly closeTestID?: string;
}

export const TransactionPickerSheetHeader = ({ title, closeLabel, onClose, closeTestID }: Props) => (
    <View className="min-h-11 flex-row items-center gap-x-xl">
        <Text dynamicTypeRamp="title3" accessibilityRole="header" className="flex-1 text-[17px] font-semibold text-primary">
            {title}
        </Text>
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            testID={closeTestID}
            className="min-h-11 justify-center px-sm active:opacity-60"
        >
            <Text dynamicTypeRamp="footnote" className="text-[15px] font-semibold text-primary">
                {closeLabel}
            </Text>
        </HapticPressable>
    </View>
);
