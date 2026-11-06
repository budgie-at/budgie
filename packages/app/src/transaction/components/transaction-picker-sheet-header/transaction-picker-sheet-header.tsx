import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

interface Props {
    readonly title: string;
    readonly closeLabel: string;
    readonly onClose: () => void;
    readonly closeTestID?: string;
    readonly disabled?: boolean;
}

const closeVariants = cva('min-h-11 min-w-11 items-center justify-center px-sm active:opacity-60', {
    variants: { disabled: { true: 'opacity-50' } }
});

export const TransactionPickerSheetHeader = ({ title, closeLabel, onClose, closeTestID, disabled }: Props) => {
    const largeText = useIsAccessibilityTextSize();

    return (
        <View className="min-h-11 flex-row items-center justify-end gap-x-xl">
            <Text dynamicTypeRamp="headline" accessibilityRole="header" className="flex-1 text-[17px] font-semibold text-primary">
                {title}
            </Text>
            <HapticPressable
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
                onPress={onClose}
                testID={closeTestID}
                className={closeVariants({ disabled })}
            >
                {largeText ? (
                    <Icon icon={UserIconNameEnum.X} size={24} className="text-primary" />
                ) : (
                    <Text dynamicTypeRamp="caption2" className="text-[14px] font-semibold text-primary">
                        {closeLabel}
                    </Text>
                )}
            </HapticPressable>
        </View>
    );
};
