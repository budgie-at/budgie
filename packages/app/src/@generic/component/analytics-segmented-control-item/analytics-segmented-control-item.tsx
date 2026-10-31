import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly tab: AnalyticsTabType;
    readonly label: string;
    readonly isActive: boolean;
    readonly testID: string;
    readonly onPress: (tab: AnalyticsTabType) => void;
}

const labelVariants = cva('text-[13px] text-primary', {
    variants: { isActive: { true: 'font-semibold', false: 'font-medium' } }
});

export const AnalyticsSegmentedControlItem = ({ tab, label, isActive, testID, onPress }: Props) => {
    const handlePress = () => void onPress(tab);

    const accessibilityState = { selected: isActive };

    return (
        <HapticPressable
            accessibilityRole="tab"
            accessibilityState={accessibilityState}
            className="flex-1 items-center justify-center px-md py-sm active:scale-100"
            hitSlop={0}
            testID={testID}
            onPress={handlePress}
        >
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className={labelVariants({ isActive })}
            >
                {label}
            </Text>
        </HapticPressable>
    );
};
