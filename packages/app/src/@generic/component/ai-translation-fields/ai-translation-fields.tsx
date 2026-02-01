import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeInUp, cancelAnimation, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AiTranslationFieldsHeaderRight } from '../ai-translation-fields-header-right/ai-translation-fields-header-right';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface ModelStatusInterface {
    readonly isReady: boolean;
    readonly isInitializing: boolean;
    readonly downloadProgress: number;
    readonly error: string | null;
}

interface Props {
    readonly titleEn: string | null;
    readonly titleTags: string | null;
    readonly isRegenerating: boolean;
    readonly disabled?: boolean;
    readonly onRegenerate: () => void;
    readonly onTitleEnPress?: () => void;
    readonly onTitleTagsPress?: () => void;
    readonly animationDelay?: number;
    readonly modelStatus: ModelStatusInterface;
}

const FIELD_DELAY_OFFSET = 100;
const DEFAULT_ANIMATION_DELAY = 200;
const FULL_ROTATION = 360;
const ROTATION_DURATION = 1000;

export const AiTranslationFields = (props: Props) => {
    const {
        titleEn,
        titleTags,
        isRegenerating,
        disabled = false,
        onRegenerate,
        onTitleEnPress,
        onTitleTagsPress,
        animationDelay = DEFAULT_ANIMATION_DELAY,
        modelStatus
    } = props;
    const { t } = useLingui();
    const rotation = useSharedValue(0);

    const englishValue = titleEn ?? t`Not generated`;
    const tagsValue = titleTags ?? t`Not generated`;

    const tagsDelay = animationDelay + FIELD_DELAY_OFFSET;

    useEffect(() => {
        if (isRegenerating) {
            rotation.set(withRepeat(withTiming(FULL_ROTATION, { duration: ROTATION_DURATION, easing: Easing.linear }), -1, false));
        } else {
            cancelAnimation(rotation);
            rotation.set(withTiming(0, { duration: DEFAULT_ANIMATION_DELAY }));
        }
    }, [isRegenerating, rotation]);

    const fieldOpacity = modelStatus.isReady ? '' : 'opacity-40';
    const isTitleEnPressDisabled = !onTitleEnPress || !modelStatus.isReady || disabled;
    const isTitleTagsPressDisabled = !onTitleTagsPress || !modelStatus.isReady || disabled;

    return (
        <View className="px-3xl pt-xl">
            <View className="bg-secondary-background rounded-2xl border border-secondary-corner overflow-hidden">
                <View className="flex-row items-center px-xl py-md border-b border-secondary-corner">
                    <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground ml-sm uppercase font-medium flex-1">
                        <Trans>AI-Generated Metadata</Trans>
                    </Text>
                    {disabled ? null : (
                        <AiTranslationFieldsHeaderRight
                            isRegenerating={isRegenerating}
                            modelStatus={modelStatus}
                            rotation={rotation}
                            onRegenerate={onRegenerate}
                        />
                    )}
                </View>

                {/* jscpd:ignore-start -- Intentionally similar field rows with different icons/labels */}
                <Animated.View
                    entering={FadeInUp.delay(animationDelay).duration(DEFAULT_ANIMATION_DELAY)}
                    className={`px-xl py-lg border-b border-secondary-corner ${fieldOpacity}`}
                >
                    <HapticPressable className="flex-row items-center" onPress={onTitleEnPress} disabled={isTitleEnPressDisabled}>
                        <Icon icon={UserIconNameEnum.Globe} size={18} className="text-secondary-foreground" />
                        <View className="ml-lg flex-1">
                            <Text className="text-xxs text-secondary-foreground uppercase">
                                <Trans>English Translation</Trans>
                            </Text>
                            <Text className="text-sm text-primary font-medium" numberOfLines={1}>
                                {englishValue}
                            </Text>
                        </View>
                    </HapticPressable>
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(tagsDelay).duration(DEFAULT_ANIMATION_DELAY)}
                    className={`px-xl py-lg ${fieldOpacity}`}
                >
                    <HapticPressable className="flex-row items-center" onPress={onTitleTagsPress} disabled={isTitleTagsPressDisabled}>
                        <Icon icon={UserIconNameEnum.Tag} size={18} className="text-secondary-foreground mt-xs" />
                        <View className="ml-lg flex-1">
                            <Text className="text-xxs text-secondary-foreground uppercase">
                                <Trans>Search Keywords</Trans>
                            </Text>
                            <Text className="text-sm text-primary font-medium">{tagsValue}</Text>
                        </View>
                    </HapticPressable>
                </Animated.View>
                {/* jscpd:ignore-end */}
            </View>
        </View>
    );
};
