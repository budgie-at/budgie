import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Plural, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { UncategorizedTransactionsPillPropsInterface } from '../../interface/uncategorized-transactions-pill-props.interface';

const ANIMATION_DURATION_MS = 180;
const ENTERING = FadeIn.duration(ANIMATION_DURATION_MS);
const EXITING = FadeOut.duration(ANIMATION_DURATION_MS);
const LAYOUT = LinearTransition.duration(ANIMATION_DURATION_MS);

export const UncategorizedTransactionsPill = ({ count, onPress }: UncategorizedTransactionsPillPropsInterface) => {
    const { t } = useLingui();

    const accessibilityLabel = t({ message: plural(count, { one: '# missing category', other: '# missing categories' }) });

    return (
        <Animated.View entering={ENTERING} exiting={EXITING} layout={LAYOUT} className="self-start">
            <HapticPressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                className="h-9 min-w-48 px-lg rounded-full border border-warning-corner bg-warning-background flex-row items-center justify-center gap-x-sm"
            >
                <View className="h-5 w-5 rounded-full bg-warning-corner items-center justify-center">
                    <Icon icon={UserIconNameEnum.BadgeQuestionMark} className="text-warning-foreground" size={14} />
                </View>
                <Text className="text-warning-foreground text-sm font-semibold" numberOfLines={1}>
                    <Plural value={count} one="# missing category" other="# missing categories" />
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
