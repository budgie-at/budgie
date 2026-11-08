import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SCREEN_CHROME_EDGE_RAMP_LENGTH } from '../../constant/screen-chrome-config.constant';

import type { EdgeFadeBandRenderPropsInterface } from '@rnw-community/react-native-screen-chrome';

interface Props extends Pick<EdgeFadeBandRenderPropsInterface, 'blur' | 'position' | 'height'> {
    readonly plateau: number;
    readonly solid: string;
}

export const ScreenChromeEdgeGradient = ({ blur, position, height, plateau, solid }: Props) => {
    const gradientID = useId();
    const gradientFill = `url(#${gradientID})`;
    const gradientEnd = position === 'top' ? 1 : 0;
    const gradientStart = position === 'top' ? 0 : 1;
    const blurStyle = {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        height: Math.min(SCREEN_CHROME_EDGE_RAMP_LENGTH, height),
        [position === 'top' ? 'bottom' : 'top']: 0,
        overflow: 'hidden' as const
    };

    return (
        <>
            <View style={blurStyle}>{blur}</View>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <LinearGradient id={gradientID} x1="0" y1={gradientStart} x2="0" y2={gradientEnd}>
                        <Stop offset="0" stopColor={solid} />
                        <Stop offset={plateau} stopColor={solid} />
                        <Stop offset="1" stopColor={solid} stopOpacity={0} />
                    </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={gradientFill} />
            </Svg>
        </>
    );
};
