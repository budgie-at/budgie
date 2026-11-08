import { useResolveClassNames, useUniwind } from 'uniwind';

import { SCREEN_CHROME_DEFAULT_CONFIG, ScreenChromeProvider } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isString } from '@rnw-community/shared';

import { ScreenChromeEdgeBand } from '../component/screen-chrome-edge-band/screen-chrome-edge-band';
import {
    SCREEN_CHROME_CONFIG,
    SCREEN_CHROME_TITLE_CLEARANCE,
    SCREEN_CHROME_EDGE_RAMP_LENGTH
} from '../constant/screen-chrome-config.constant';

import type { EdgeFadeBandRenderPropsInterface, ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly syncNativeScrollOffset?: boolean;
    readonly config?: ScreenChromeConfigOverridesInterface;
}

const FADE_SOLID_CLASSNAME = 'bg-surface';
const FADE_WASH_CLASSNAME = 'bg-surface/5';

const renderEdgeFadeBand = ({ blur, position, height, colorScheme }: EdgeFadeBandRenderPropsInterface) => (
    <ScreenChromeEdgeBand blur={blur} position={position} height={height} colorScheme={colorScheme} />
);

export const ScreenChromeThemeProvider = ({ children, syncNativeScrollOffset, config = SCREEN_CHROME_CONFIG }: Props) => {
    const { theme } = useUniwind();
    const { backgroundColor: solid } = useResolveClassNames(FADE_SOLID_CLASSNAME);
    const { backgroundColor: wash } = useResolveClassNames(FADE_WASH_CLASSNAME);
    const surfaceColors = isString(solid) && isString(wash) ? { solid, wash } : null;
    const headerBandHeight =
        (config.collapsedHeaderHeight ?? config.headerHeight ?? SCREEN_CHROME_DEFAULT_CONFIG.headerHeight) +
        SCREEN_CHROME_TITLE_CLEARANCE +
        SCREEN_CHROME_EDGE_RAMP_LENGTH;
    const surfaceConfig = {
        ...config,
        topFadeHeight: headerBandHeight,
        headerBackdropHeight: headerBandHeight,
        ...(isDefined(surfaceColors) && { colors: { light: surfaceColors, dark: surfaceColors } })
    };

    return (
        <ScreenChromeProvider
            colorScheme={theme}
            config={surfaceConfig}
            syncNativeScrollOffset={syncNativeScrollOffset}
            renderEdgeFadeBand={renderEdgeFadeBand}
        >
            {children}
        </ScreenChromeProvider>
    );
};
