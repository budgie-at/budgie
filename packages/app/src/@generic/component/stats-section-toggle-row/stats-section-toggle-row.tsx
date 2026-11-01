import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

const rowVariants = cva('min-h-[44px] justify-center py-md pr-xl active:scale-100 active:bg-surface-fill', {
    variants: { isStacked: { true: 'pl-3xl', false: 'pl-[60px]' } }
});

export const StatsSectionToggleRow = ({ label, testID, onPress }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    return (
        <HapticPressable accessibilityRole="button" className={rowVariants({ isStacked })} hitSlop={0} testID={testID} onPress={onPress}>
            <Text className="text-[15px] text-default-foreground">{label}</Text>
        </HapticPressable>
    );
};
