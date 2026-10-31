import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly count: number;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

const EXIT_DURATION_MS = 160;

export const TagsSelectorDoneButton = ({ count, onPress, testID }: Props) => {
    const { t } = useLingui();

    return (
        <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutDown.duration(EXIT_DURATION_MS)}
            className="absolute inset-x-0 bottom-0 items-center bg-linear-to-b from-primary-reverse/0 via-primary-reverse via-40% to-primary-reverse pt-3xl pb-safe-offset-[4px]"
            pointerEvents="box-none"
        >
            <HapticPressable
                onPress={onPress}
                testID={testID}
                className="rounded-full bg-primary px-2xl py-md flex-row items-center gap-x-sm"
                accessibilityRole="button"
                accessibilityLabel={t`Confirm tag selection`}
            >
                <Text className="text-primary-reverse text-sm font-semibold">
                    <Trans>Done ({count})</Trans>
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
