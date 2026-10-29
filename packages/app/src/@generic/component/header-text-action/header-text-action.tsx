import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const HeaderTextAction = ({ label, onPress, testID }: Props) => (
    <HapticPressable
        accessibilityRole="button"
        className="min-h-[44px] justify-center px-md active:opacity-70"
        hitSlop={8}
        testID={testID}
        onPress={onPress}
    >
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-md font-medium text-primary">
            {label}
        </Text>
    </HapticPressable>
);
