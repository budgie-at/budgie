import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly count: number;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

const BOTTOM_PADDING = 4;
const EXIT_DURATION_MS = 160;

export const TagsSelectorDoneButton = ({ count, onPress, testID }: Props) => {
    const { t } = useLingui();
    const insets = useSafeAreaInsets();

    const containerStyle = {
        position: 'absolute' as const,
        bottom: insets.bottom + BOTTOM_PADDING,
        left: 0,
        right: 0,
        alignItems: 'center' as const
    };

    return (
        <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutDown.duration(EXIT_DURATION_MS)}
            style={containerStyle}
            pointerEvents="box-none"
        >
            <HapticPressable
                onPress={onPress}
                testID={testID}
                className="rounded-full bg-primary px-2xl py-md flex-row items-center gap-x-sm"
                accessibilityRole="button"
                accessibilityLabel={t`Confirm tag selection`}
            >
                <Text className="text-primary-reverse text-sm font-semibold">{t`Done (${count})`}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
