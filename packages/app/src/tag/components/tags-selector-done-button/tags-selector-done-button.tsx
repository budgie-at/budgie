import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly count: number;
    readonly onPress: EmptyFn;
    readonly hint: string | null;
    readonly testID?: string;
}

const EXIT_DURATION_MS = 160;

export const TagsSelectorDoneButton = ({ count, onPress, hint, testID }: Props) => {
    const { t } = useLingui();

    return (
        <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutDown.duration(EXIT_DURATION_MS)}
            className="absolute inset-x-0 bottom-0 items-center bg-surface pt-md pb-safe-offset-[4px]"
            pointerEvents="box-none"
        >
            <View pointerEvents="none" className="absolute inset-x-0 bottom-full h-[24px] bg-linear-to-b from-surface/0 to-surface" />
            {isDefined(hint) ? <Text className="text-secondary-foreground pb-md text-[13px]">{hint}</Text> : null}
            <HapticPressable
                onPress={onPress}
                testID={testID}
                className="h-[44px] rounded-full bg-primary px-3xl flex-row items-center gap-x-sm"
                accessibilityRole="button"
                accessibilityLabel={t`Confirm tag selection`}
            >
                <Text className="text-primary-reverse text-[17px] font-semibold">
                    <Trans>Done ({count})</Trans>
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
