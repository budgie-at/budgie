import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxCtaButton = ({ label, testID, onPress }: Props) => (
    <HapticPressable
        onPress={onPress}
        className="min-h-[52px] items-center justify-center rounded-full bg-cta-background px-5xl py-md active:opacity-80"
        style={CONTINUOUS_CORNERS}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
    >
        <Text className="text-cta-foreground text-center text-[17px] font-semibold tabular-nums" numberOfLines={2}>
            {label}
        </Text>
    </HapticPressable>
);
