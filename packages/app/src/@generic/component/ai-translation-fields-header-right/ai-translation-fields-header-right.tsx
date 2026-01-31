import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';
import Animated, { FadeInUp, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../icon/icon';

interface ModelStatusInterface {
    readonly isReady: boolean;
    readonly isInitializing: boolean;
    readonly downloadProgress: number;
    readonly error: string | null;
}

interface Props {
    readonly isRegenerating: boolean;
    readonly modelStatus: ModelStatusInterface;
    readonly rotation: SharedValue<number>;
    readonly onRegenerate: () => void;
}

const DEFAULT_ANIMATION_DELAY = 200;

const getStatusBadgeText = (status: ModelStatusInterface, t: ReturnType<typeof useLingui>['t']): string | null => {
    if (isDefined(status.error)) {
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

export const AiTranslationFieldsHeaderRight = (props: Props) => {
    const { isRegenerating, modelStatus, rotation, onRegenerate } = props;
    const { t } = useLingui();

    const rotatingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    const statusBadge = getStatusBadgeText(modelStatus, t);

    if (!modelStatus.isReady) {
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

    return (
        <Pressable onPress={onRegenerate} disabled={isRegenerating} hitSlop={12}>
            <Animated.View style={rotatingStyle}>
                <Icon icon={UserIconNameEnum.RefreshCw} size={16} className="text-primary" />
            </Animated.View>
        </Pressable>
    );
};
