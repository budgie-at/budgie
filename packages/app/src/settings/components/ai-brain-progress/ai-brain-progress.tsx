import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

const ANIMATION_DURATION = 300;
const PERCENT_DIVISOR = 100;

const styles = StyleSheet.create({
    iconPosition: { position: 'absolute', bottom: 0, left: 0 }
});

interface Props {
    readonly progress: number;
    readonly size: number;
    readonly iconSize: number;
}

export const AiBrainProgress = ({ progress, size, iconSize }: Props) => {
    const progressValue = useSharedValue(0);

    useEffect(() => {
        progressValue.value = progress;
    }, [progress, progressValue]);

    const clipStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden' as const,
        height: withTiming((progressValue.value / PERCENT_DIVISOR) * iconSize, { duration: ANIMATION_DURATION })
    }));

    const containerStyle: ViewStyle = useMemo(() => ({ width: size, height: size, borderRadius: size / 2 }), [size]);
    const iconWrapperStyle: ViewStyle = useMemo(() => ({ width: iconSize, height: iconSize }), [iconSize]);

    return (
        <View className="items-center justify-center bg-ghost-background" style={containerStyle}>
            <View style={iconWrapperStyle}>
                <Icon className="text-secondary-foreground opacity-60" icon={UserIconNameEnum.Brain} size={iconSize} />
                <Animated.View style={clipStyle}>
                    <Icon className="text-positive-foreground" icon={UserIconNameEnum.Brain} size={iconSize} style={styles.iconPosition} />
                </Animated.View>
            </View>
        </View>
    );
};
