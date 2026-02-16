import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useSuggestRuleModal } from '../../context/suggest-rule-modal.context';
import { useMatchingTransactionCount } from '../../hooks/use-matching-transaction-count.hook';
import { useQuickRuleCreation } from '../../hooks/use-quick-rule-creation.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

const BACKDROP_FADE_DURATION = 200;
const BACKDROP_OPACITY = 0.5;
const CARD_SPRING_CONFIG = { damping: 20, stiffness: 200 };
const SPARKLE_ROTATION_DURATION = 600;
const SUCCESS_DISMISS_DELAY = 800;
const DISMISS_FADE_DURATION = 100;
const CARD_INITIAL_TRANSLATE = 400;

const buttonVariants = cva('h-12 items-center justify-center rounded-xl', {
    variants: {
        variant: {
            destructive: 'bg-destructive-background',
            positive: 'bg-positive-background',
            default: 'bg-default-background',
            warning: 'bg-warning-background',
            'dark-warning': 'bg-dark-warning-background',
            ghost: 'bg-ghost-background',
            pink: 'bg-pink-background',
            secondary: 'bg-ghost-background',
            primary: 'bg-primary-reverse',
            cta: 'bg-cta-background'
        }
    },
    defaultVariants: { variant: 'default' }
});

const buttonTextVariants = cva('text-base font-semibold', {
    variants: { variant: FOREGROUND_COLOR_PALETTE },
    defaultVariants: { variant: 'default' }
});

const sparkleVariants = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE },
    defaultVariants: { variant: 'default' }
});

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly variant: ColorPaletteVariant;
    readonly onRuleCreated: () => void;
    readonly onComplete: () => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Animated overlay component with multiple animation values and handlers
export const PostSaveRuleNudge = ({ suggestRuleData, variant, onRuleCreated, onComplete }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const [hapticNotification] = useVibration();
    const { openSuggestRule } = useSuggestRuleModal();
    const { handleQuickCreate, isCreating, isSuccess } = useQuickRuleCreation({ suggestRuleData, onRuleCreated });

    const [isDismissing, setIsDismissing] = useState(false);

    const conditions = [
        {
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: suggestRuleData.title,
            secondaryValue: null
        }
    ];

    if (isNotEmptyString(suggestRuleData.mccCode)) {
        conditions.push({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: suggestRuleData.mccCode,
            secondaryValue: null
        });
    }

    const { count } = useMatchingTransactionCount({
        conditions,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        enabled: true
    });

    const backdropOpacity = useSharedValue(0);
    const cardTranslateY = useSharedValue(CARD_INITIAL_TRANSLATE);
    const sparkleRotation = useSharedValue(0);

    useEffect(() => {
        backdropOpacity.value = withTiming(BACKDROP_OPACITY, { duration: BACKDROP_FADE_DURATION });
        cardTranslateY.value = withSpring(0, CARD_SPRING_CONFIG);
        sparkleRotation.value = withTiming(360, { duration: SPARKLE_ROTATION_DURATION });
    }, [backdropOpacity, cardTranslateY, sparkleRotation]);

    const animateDismiss = (callback: () => void) => {
        setIsDismissing(true);
        cardTranslateY.value = withSpring(CARD_INITIAL_TRANSLATE, CARD_SPRING_CONFIG);
        backdropOpacity.value = withTiming(0, { duration: DISMISS_FADE_DURATION }, finished => {
            if (finished) {
                runOnJS(callback)();
            }
        });
    };

    useEffect(() => {
        if (!isSuccess) {
            return emptyFn;
        }

        hapticNotification(NotificationFeedbackType.Success);

        const timer = setTimeout(() => {
            animateDismiss(onComplete);
        }, SUCCESS_DISMISS_DELAY);

        return () => {
            clearTimeout(timer);
        };
    }, [isSuccess]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardTranslateY.value }] }));
    const sparkleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sparkleRotation.value}deg` }] }));

    const handleCreate = () => {
        handleQuickCreate();
    };

    const handleCustomize = async () => {
        const result = await openSuggestRule({ suggestRuleData });

        if (result === 'created') {
            onRuleCreated();
        }

        onComplete();
    };

    const handleSkip = () => {
        animateDismiss(onComplete);
    };

    const handleBackdropPress = () => {
        if (!isDismissing && !isCreating) {
            animateDismiss(onComplete);
        }
    };

    const displayCount = isDefined(count) && count > 0 ? count : 0;
    const bottomPadding = { paddingBottom: bottom + 16 };
    const iconName = isSuccess ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Sparkles;
    const isInteractionDisabled = isDismissing || isCreating || isSuccess;
    const containerStyle = { zIndex: 50 };
    const cardContainerStyle = [cardStyle, bottomPadding];

    return (
        <View className="absolute inset-0" style={containerStyle}>
            <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} onTouchEnd={handleBackdropPress} />

            <Animated.View className="absolute inset-x-0 bottom-0 px-lg" style={cardContainerStyle}>
                <View className="rounded-3xl bg-primary-reverse px-5xl py-3xl">
                    <View className="items-center gap-sm">
                        <Animated.View style={sparkleStyle}>
                            <Icon icon={iconName} size={32} className={sparkleVariants({ variant })} />
                        </Animated.View>

                        <Text className="text-xl font-semibold text-primary">
                            {isSuccess ? <Trans>Rule created!</Trans> : <Trans>Automate this?</Trans>}
                        </Text>

                        {displayCount > 0 ? (
                            <Text className="text-sm text-secondary-foreground">
                                {isSuccess ? t`${displayCount} transactions updated` : t`${displayCount} similar transactions`}
                            </Text>
                        ) : null}
                    </View>

                    <View className="mt-xl gap-md">
                        {isSuccess ? null : (
                            <>
                                <HapticPressable
                                    onPress={handleCreate}
                                    disabled={isInteractionDisabled}
                                    className={buttonVariants({ variant })}
                                >
                                    {isCreating ? (
                                        <ActivityIndicator size="small" />
                                    ) : (
                                        <Text className={buttonTextVariants({ variant })}>
                                            <Trans>Create Rule</Trans>
                                        </Text>
                                    )}
                                </HapticPressable>

                                <View className="flex-row items-center justify-center gap-md">
                                    <HapticPressable onPress={handleCustomize} disabled={isInteractionDisabled}>
                                        <Text className="text-sm text-secondary-foreground">
                                            <Trans>Customize</Trans>
                                        </Text>
                                    </HapticPressable>

                                    <Text className="text-sm text-secondary-foreground/50">&middot;</Text>

                                    <HapticPressable onPress={handleSkip} disabled={isInteractionDisabled}>
                                        <Text className="text-sm text-secondary-foreground">
                                            <Trans>Skip</Trans>
                                        </Text>
                                    </HapticPressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};
