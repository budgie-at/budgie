import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly amount: number;
    readonly comment: string;
    readonly onApply: (categoryId: number) => void;
}

const FADE_DURATION = 200;
const PULSE_DURATION = 2000;
const SPARKLE_ROTATION_DURATION = 3000;
const FLOAT_DURATION = 2500;
const PULSE_MIN_SCALE = 0.98;
const PULSE_MAX_SCALE = 1;
const FLOAT_OFFSET = 1.5;
const FULL_ROTATION = 360;
const POSITION_STYLE = { left: '50%', transform: [{ translateX: '-50%' }] } as const;

// eslint-disable-next-line max-statements -- Component with animations and conditional states
export const CategorySuggestionBubble = (props: Props) => {
    const { transactionTitle, mccCategoryId, amount, comment, onApply } = props;
    const { t } = useLingui();

    const { status, suggestedCategory } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        amount,
        comment,
        enabled: true
    });

    const pulseScale = useSharedValue(PULSE_MIN_SCALE);
    const floatOffset = useSharedValue(0);
    const sparkleRotation = useSharedValue(0);

    useEffect(() => {
        pulseScale.set(withRepeat(withTiming(PULSE_MAX_SCALE, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }), -1, true));
        floatOffset.set(
            withRepeat(
                withSequence(
                    withTiming(-FLOAT_OFFSET, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.ease) }),
                    withTiming(FLOAT_OFFSET, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            )
        );
        sparkleRotation.set(
            withRepeat(withTiming(FULL_ROTATION, { duration: SPARKLE_ROTATION_DURATION, easing: Easing.linear }), -1, false)
        );
    }, [floatOffset, pulseScale, sparkleRotation]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatOffset.value }, { scale: pulseScale.value }]
    }));

    const sparkleStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${sparkleRotation.value}deg` }]
    }));

    const isInitializing = status === 'initializing';
    const isLoading = status === 'loading';
    const isReady = status === 'success' && isDefined(suggestedCategory);
    const showLoadingState = isInitializing || isLoading;

    if (!showLoadingState && !isReady) {
        return null;
    }

    const handleApply = () => {
        if (isDefined(suggestedCategory)) {
            onApply(suggestedCategory.id);
        }
    };

    const thinkingText = t`Thinking...`;
    const categoryTitle = suggestedCategory?.title ?? '';
    const accessibilityLabel = isReady ? t`AI suggests: ${categoryTitle}. Tap to apply` : t`AI is analyzing transaction`;
    const handlePress = isReady ? handleApply : emptyFn;

    return (
        <Animated.View
            entering={FadeIn.duration(FADE_DURATION)}
            exiting={FadeOut.duration(FADE_DURATION)}
            className="absolute -top-[48px] z-10"
            style={POSITION_STYLE}
        >
            <Animated.View style={containerStyle} className="items-center">
                <View className="-ml-[100px]">
                    <HapticPressable
                        className="flex-row items-center gap-sm px-xl py-sm bg-default-background border border-default-corner rounded-2xl min-w-[140px] justify-center"
                        accessibilityLabel={accessibilityLabel}
                        onPress={handlePress}
                        disabled={!isReady}
                    >
                        <Animated.View style={sparkleStyle}>
                            <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-default-foreground" />
                        </Animated.View>
                        {showLoadingState ? (
                            <Text className="text-sm text-default-foreground">{thinkingText}</Text>
                        ) : (
                            <Text className="text-sm font-medium text-default-foreground" numberOfLines={1}>
                                {categoryTitle}
                            </Text>
                        )}
                    </HapticPressable>
                </View>
                <View className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-default-background -mt-px" />
            </Animated.View>
        </Animated.View>
    );
};
