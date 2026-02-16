import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
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

const BACKDROP_OPACITY = 0.5;
const SUCCESS_DISMISS_DELAY = 800;

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

// eslint-disable-next-line max-statements, max-lines-per-function -- Overlay component with multiple handlers
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

    useEffect(() => {
        if (!isSuccess) {
            return emptyFn;
        }

        hapticNotification(NotificationFeedbackType.Success);

        const timer = setTimeout(() => {
            setIsDismissing(true);
            onComplete();
        }, SUCCESS_DISMISS_DELAY);

        return () => {
            clearTimeout(timer);
        };
    }, [isSuccess]);

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
        onComplete();
    };

    const handleBackdropPress = () => {
        if (!isDismissing && !isCreating) {
            onComplete();
        }
    };

    const displayCount = isDefined(count) && count > 0 ? count : 0;
    const bottomPadding = { paddingBottom: bottom + 16 };
    const iconName = isSuccess ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Sparkles;
    const isInteractionDisabled = isDismissing || isCreating || isSuccess;
    const containerStyle = { zIndex: 50 };
    const backdropStyle = { opacity: BACKDROP_OPACITY };

    return (
        <View className="absolute inset-0" style={containerStyle}>
            <View className="absolute inset-0 bg-black" style={backdropStyle} onTouchEnd={handleBackdropPress} />

            <View className="absolute inset-x-0 bottom-0 px-lg" style={bottomPadding}>
                <View className="rounded-3xl bg-primary-reverse px-5xl py-3xl">
                    <View className="items-center gap-sm">
                        <Icon icon={iconName} size={32} className={sparkleVariants({ variant })} />

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
            </View>
        </View>
    );
};
