import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { EdgeFade as ScreenChromeEdgeFade, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { getEdgeFadeMaskStops } from './utils/edge-fade-get-mask-stops.util';

import type { EdgeFadeBandRenderPropsInterface, EdgeFadePropsInterface } from '@rnw-community/react-native-screen-chrome';
import type { ReactNode } from 'react';

type Props = Pick<EdgeFadePropsInterface, 'position' | 'height' | 'intensity' | 'scrollAnimation' | 'blurMethod' | 'style'>;

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 0, y: 1 };

const edgeFadeStyles = StyleSheet.create({
    fill: {
        flex: 1
    }
});

export const EdgeFade = ({ position, height, intensity, scrollAnimation, blurMethod = 'dimezisBlurView', style }: Props): ReactNode => {
    const { config } = useScreenChrome();
    const maskGradient = getEdgeFadeMaskStops(config.maskStops, position);

    const renderBand = ({ blur, washColors }: EdgeFadeBandRenderPropsInterface) => (
        <View style={edgeFadeStyles.fill}>
            {blur}
            <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={
                    <LinearGradient
                        colors={maskGradient.colors}
                        locations={maskGradient.locations}
                        start={GRADIENT_START}
                        end={GRADIENT_END}
                        style={edgeFadeStyles.fill}
                    />
                }
            >
                <LinearGradient colors={washColors} start={GRADIENT_START} end={GRADIENT_END} style={StyleSheet.absoluteFill} />
            </MaskedView>
        </View>
    );

    return (
        <ScreenChromeEdgeFade
            position={position}
            height={height}
            intensity={intensity}
            scrollAnimation={scrollAnimation}
            blurMethod={blurMethod}
            renderBand={renderBand}
            style={style}
        />
    );
};
