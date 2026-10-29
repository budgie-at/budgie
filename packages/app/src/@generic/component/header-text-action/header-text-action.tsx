import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

const HIT_SLOP = { left: 12, right: 12 } as const;

export const HeaderTextAction = ({ label, onPress, testID }: Props) => (
    <HapticPressable
        accessibilityRole="button"
        className="min-h-[44px] justify-center active:opacity-70"
        hitSlop={HIT_SLOP}
        testID={testID}
        onPress={onPress}
    >
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-md font-medium text-primary">
            {label}
        </Text>
    </HapticPressable>
);
