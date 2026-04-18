import { UserIconNameEnum } from '@budgie/contracts';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { Icon } from '../../../@generic/component/icon/icon';
import {
    LONG_PRESS_RING_FILL_COLOR,
    LONG_PRESS_RING_PADDING,
    LONG_PRESS_RING_ROTATION_OFFSET,
    LONG_PRESS_RING_STROKE_WIDTH,
    LONG_PRESS_RING_TRACK_COLOR,
    LONG_PRESS_RING_TRACK_OPACITY
} from '../../constant/long-press-brain.constant';
import { useAiSubsystemIconAnimations, useAiSubsystemIconHoldRing } from '../../hook/use-ai-subsystem-icon-animations.hook';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HALF = 2;
const SVG_FILL_NONE = 'none' as const;
const SVG_STROKE_LINECAP_ROUND = 'round' as const;

const styles = StyleSheet.create({
    iconBase: { position: 'absolute', bottom: 0, left: 0 }
});

interface Props {
    readonly icon: UserIconNameEnum;
    readonly percent: number;
    readonly holdProgress: SharedValue<number>;
    readonly size: number;
    readonly iconSize: number;
    readonly pulsePeriodMs: number | null;
    readonly colorClass: string;
}

export const AiSubsystemIcon = ({ icon, percent, holdProgress, size, iconSize, pulsePeriodMs, colorClass }: Props) => {
    const { pulseStyle, clipStyle } = useAiSubsystemIconAnimations({ percent, iconSize, pulsePeriodMs });

    const ringSize = size + LONG_PRESS_RING_PADDING * HALF + LONG_PRESS_RING_STROKE_WIDTH * HALF;
    const ringCenter = ringSize / HALF;
    const ringRadius = (ringSize - LONG_PRESS_RING_STROKE_WIDTH) / HALF;
    const ringCircumference = HALF * Math.PI * ringRadius;
    const ringOffset = (ringSize - size) / HALF;

    const { holdRingStyle } = useAiSubsystemIconHoldRing({ holdProgress, ringCircumference, ringOffset });
    const holdAnimatedProps = useAnimatedProps(() => ({
        strokeDashoffset: ringCircumference * (1 - holdProgress.get())
    }));

    const containerStyle: ViewStyle = { width: size, height: size, borderRadius: size / HALF };
    const iconWrapperStyle: ViewStyle = { width: iconSize, height: iconSize };
    const outerStyle = [containerStyle, pulseStyle];

    return (
        <Animated.View style={outerStyle} className="items-center justify-center bg-ghost-background">
            <View style={iconWrapperStyle}>
                <Icon className="text-secondary-foreground opacity-60" icon={icon} size={iconSize} />
                <Animated.View style={clipStyle}>
                    <Icon className={colorClass} icon={icon} size={iconSize} style={styles.iconBase} />
                </Animated.View>
            </View>
            <Animated.View style={holdRingStyle}>
                <Svg width={ringSize} height={ringSize}>
                    <Circle
                        cx={ringCenter}
                        cy={ringCenter}
                        r={ringRadius}
                        stroke={LONG_PRESS_RING_TRACK_COLOR}
                        strokeWidth={LONG_PRESS_RING_STROKE_WIDTH}
                        fill={SVG_FILL_NONE}
                        opacity={LONG_PRESS_RING_TRACK_OPACITY}
                    />
                    <AnimatedCircle
                        cx={ringCenter}
                        cy={ringCenter}
                        r={ringRadius}
                        stroke={LONG_PRESS_RING_FILL_COLOR}
                        strokeWidth={LONG_PRESS_RING_STROKE_WIDTH}
                        fill={SVG_FILL_NONE}
                        strokeLinecap={SVG_STROKE_LINECAP_ROUND}
                        strokeDasharray={`${ringCircumference}`}
                        rotation={LONG_PRESS_RING_ROTATION_OFFSET}
                        origin={`${ringCenter}, ${ringCenter}`}
                        animatedProps={holdAnimatedProps}
                    />
                </Svg>
            </Animated.View>
        </Animated.View>
    );
};
