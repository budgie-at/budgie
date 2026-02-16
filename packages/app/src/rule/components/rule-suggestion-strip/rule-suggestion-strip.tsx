import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInUp,
    SlideOutDown,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useSuggestRuleModal } from '../../context/suggest-rule-modal.context';
import { useMatchingTransactionCount } from '../../hooks/use-matching-transaction-count.hook';
import { useQuickRuleCreation } from '../../hooks/use-quick-rule-creation.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

const ENTRY_DELAY_MS = 500;
const SPARKLE_ANIMATION_DURATION = 600;
const SUCCESS_EXIT_DELAY_MS = 600;

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly variant: ColorPaletteVariant;
    readonly onRuleCreated: () => void;
}

const stripVariants = cva('flex-row items-center rounded-2xl border h-10 px-md', {
    variants: {
        variant: {
            destructive: 'bg-destructive-background border-destructive-foreground/15',
            positive: 'bg-positive-background border-positive-foreground/15',
            default: 'bg-default-background border-default-foreground/15',
            warning: 'bg-warning-background border-warning-foreground/15',
            'dark-warning': 'bg-dark-warning-background border-dark-warning-foreground/15',
            ghost: 'bg-ghost-background border-ghost-foreground/15',
            pink: 'bg-pink-background border-pink-foreground/15',
            secondary: 'bg-ghost-background border-secondary-foreground/15',
            primary: 'bg-primary-reverse border-primary/15',
            cta: 'bg-cta-background border-cta-foreground/15'
        }
    },
    defaultVariants: { variant: 'default' }
});

const textVariants = cva('text-xs font-medium', {
    variants: {
        variant: {
            destructive: 'text-destructive-foreground',
            positive: 'text-positive-foreground',
            default: 'text-default-foreground',
            warning: 'text-warning-foreground',
            'dark-warning': 'text-dark-warning-foreground',
            ghost: 'text-ghost-foreground',
            pink: 'text-pink-foreground',
            secondary: 'text-secondary-foreground',
            primary: 'text-primary',
            cta: 'text-cta-foreground'
        }
    },
    defaultVariants: { variant: 'default' }
});

const buttonVariants = cva('rounded-xl px-sm h-7 items-center justify-center', {
    variants: {
        variant: {
            destructive: 'bg-destructive-foreground/15',
            positive: 'bg-positive-foreground/15',
            default: 'bg-default-foreground/15',
            warning: 'bg-warning-foreground/15',
            'dark-warning': 'bg-dark-warning-foreground/15',
            ghost: 'bg-ghost-foreground/15',
            pink: 'bg-pink-foreground/15',
            secondary: 'bg-secondary-foreground/15',
            primary: 'bg-primary/15',
            cta: 'bg-cta-foreground/15'
        }
    },
    defaultVariants: { variant: 'default' }
});

// eslint-disable-next-line max-statements, max-lines-per-function -- Animated strip component with multiple hooks and animation values
export const RuleSuggestionStrip = (props: Props) => {
    const { suggestRuleData, variant, onRuleCreated } = props;

    const [hapticNotification] = useVibration();
    const { openSuggestRule } = useSuggestRuleModal();
    const { handleQuickCreate, isCreating, isSuccess } = useQuickRuleCreation({ suggestRuleData, onRuleCreated });

    const categoryId = suggestRuleData.categoryId ?? 0;
    const { category } = useGetCategoryByIdQuery(categoryId);
    const categoryName = category?.title ?? '';

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

    const sparkleRotation = useSharedValue(0);

    useEffect(() => {
        sparkleRotation.value = withTiming(360, { duration: SPARKLE_ANIMATION_DURATION });

        return () => void cancelAnimation(sparkleRotation);
    }, [sparkleRotation]);

    const sparkleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${sparkleRotation.value}deg` }]
    }));

    useEffect(() => {
        if (isSuccess) {
            hapticNotification(NotificationFeedbackType.Success);
        }
    }, [isSuccess, hapticNotification]);

    const handleCustomize = () => {
        void openSuggestRule({ suggestRuleData });
    };

    const handleAutomate = () => {
        handleQuickCreate();
    };

    const hasCount = isDefined(count) && count > 0;

    if (isSuccess) {
        return (
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.delay(SUCCESS_EXIT_DELAY_MS).duration(300).springify()}
                className={stripVariants({ variant })}
            >
                <View className="flex-1 flex-row items-center justify-center gap-xs">
                    <Icon icon={UserIconNameEnum.CircleCheck} size={14} className={textVariants({ variant })} />
                    <Text className={textVariants({ variant })}>
                        <Trans>Rule created</Trans>
                    </Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            entering={SlideInUp.delay(ENTRY_DELAY_MS).springify()}
            exiting={SlideOutDown.springify()}
            className={stripVariants({ variant })}
        >
            <HapticPressable onPress={handleCustomize} className="flex-1 flex-row items-center gap-xs">
                <Animated.View style={sparkleAnimatedStyle}>
                    <Icon icon={UserIconNameEnum.Sparkles} size={14} className={textVariants({ variant })} />
                </Animated.View>
                <Text className={textVariants({ variant })} numberOfLines={1}>
                    {`"${suggestRuleData.title}"`}
                </Text>
                <Icon icon={UserIconNameEnum.ArrowRight} size={12} className={textVariants({ variant })} />
                <Text className={textVariants({ variant })} numberOfLines={1}>
                    {categoryName}
                </Text>
                {hasCount ? <Text className={`${textVariants({ variant })} opacity-60`}>{`\u00B7  ${count}`}</Text> : null}
            </HapticPressable>

            <HapticPressable onPress={handleAutomate} disabled={isCreating} className={buttonVariants({ variant })}>
                {isCreating ? (
                    <ActivityIndicator size="small" />
                ) : (
                    <Text className={`${textVariants({ variant })} font-semibold`}>
                        <Trans>Automate</Trans>
                    </Text>
                )}
            </HapticPressable>
        </Animated.View>
    );
};
