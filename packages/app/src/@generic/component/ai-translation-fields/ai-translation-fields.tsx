import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { type ReactNode, useEffect } from 'react';
import { Pressable, type StyleProp, Text, View, type ViewStyle } from 'react-native';
import Animated, {
    Easing,
    FadeInUp,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

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
    readonly animationDelay?: number;
    readonly modelStatus: ModelStatusInterface;
}

const FIELD_DELAY_OFFSET = 100;
const DEFAULT_ANIMATION_DELAY = 200;
const FULL_ROTATION = 360;
const ROTATION_DURATION = 1000;

const getStatusBadgeText = (status: ModelStatusInterface, t: ReturnType<typeof useLingui>['t']): string | null => {
    if (status.error !== null) {
        return t`Unavailable`;
    }

    if (status.isInitializing) {
        return t`Loading…`;
    }

    const downloadPercent = Math.round(status.downloadProgress * 100);

    if (status.downloadProgress < 1) {
        return t`${downloadPercent}%`;
    }

    return null;
};

interface HeaderRightParams {
    readonly isReady: boolean;
    readonly statusBadge: string | null;
    readonly disabled: boolean;
    readonly isRegenerating: boolean;
    readonly onRegenerate: () => void;
    readonly rotatingStyle: StyleProp<ViewStyle>;
}

const getHeaderRight = (params: HeaderRightParams): ReactNode => {
    const { isReady, statusBadge, disabled, isRegenerating, onRegenerate, rotatingStyle } = params;

    if (!isReady) {
        if (statusBadge === null) {
            return null;
        }

        return (
            <Animated.View
                entering={FadeInUp.duration(DEFAULT_ANIMATION_DELAY)}
                className="bg-tertiary-background rounded-full px-sm py-xxs"
            >
                <Text className="text-xxs text-secondary-foreground font-medium">{statusBadge}</Text>
            </Animated.View>
        );
    }

    if (disabled) {
        return null;
    }

    return (
        <Pressable onPress={onRegenerate} disabled={isRegenerating} hitSlop={12}>
            <Animated.View style={rotatingStyle}>
                <Icon icon={UserIconNameEnum.RefreshCw} size={16} className="text-primary" />
            </Animated.View>
        </Pressable>
    );
};

export const AiTranslationFields = (props: Props) => {
    const {
        titleEn,
        titleTags,
        isRegenerating,
        disabled = false,
        onRegenerate,
        animationDelay = DEFAULT_ANIMATION_DELAY,
        modelStatus
    } = props;
    const { t } = useLingui();
    const rotation = useSharedValue(0);

    const englishValue = titleEn ?? t`Not generated`;
    const tagsValue = titleTags ?? t`Not generated`;

    const englishDelay = animationDelay;
    const tagsDelay = animationDelay + FIELD_DELAY_OFFSET;

    useEffect(() => {
        if (isRegenerating) {
            rotation.set(withRepeat(withTiming(FULL_ROTATION, { duration: ROTATION_DURATION, easing: Easing.linear }), -1, false));
        } else {
            cancelAnimation(rotation);
            rotation.set(withTiming(0, { duration: DEFAULT_ANIMATION_DELAY }));
        }
    }, [isRegenerating, rotation]);

    const rotatingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    const fieldOpacity = modelStatus.isReady ? '' : 'opacity-40';

    const statusBadge = getStatusBadgeText(modelStatus, t);

    const headerRight = getHeaderRight({
        isReady: modelStatus.isReady,
        statusBadge,
        disabled,
        isRegenerating,
        onRegenerate,
        rotatingStyle
    });

    return (
        <View className="px-3xl pt-xl">
            <View className="bg-secondary-background rounded-2xl border border-secondary-corner overflow-hidden">
                <View className="flex-row items-center px-xl py-md border-b border-secondary-corner">
                    <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground ml-sm uppercase font-medium flex-1">
                        <Trans>AI-Generated Metadata</Trans>
                    </Text>
                    {headerRight}
                </View>

                {/* jscpd:ignore-start -- Intentionally similar field rows with different icons/labels */}
                <Animated.View
                    entering={FadeInUp.delay(englishDelay).duration(DEFAULT_ANIMATION_DELAY)}
                    className={`flex-row items-center px-xl py-lg border-b border-secondary-corner ${fieldOpacity}`}
                >
                    <Icon icon={UserIconNameEnum.Globe} size={18} className="text-secondary-foreground" />
                    <View className="ml-lg flex-1">
                        <Text className="text-xxs text-secondary-foreground uppercase">
                            <Trans>English Translation</Trans>
                        </Text>
                        <Text className="text-sm text-primary font-medium" numberOfLines={1}>
                            {englishValue}
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(tagsDelay).duration(DEFAULT_ANIMATION_DELAY)}
                    className={`flex-row px-xl py-lg ${fieldOpacity}`}
                >
                    <Icon icon={UserIconNameEnum.Tag} size={18} className="text-secondary-foreground mt-xs" />
                    <View className="ml-lg flex-1">
                        <Text className="text-xxs text-secondary-foreground uppercase">
                            <Trans>Search Keywords</Trans>
                        </Text>
                        <Text className="text-sm text-primary font-medium">{tagsValue}</Text>
                    </View>
                </Animated.View>
                {/* jscpd:ignore-end */}
            </View>
        </View>
    );
};
