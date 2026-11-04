import { useResolveClassNames, useUniwind } from 'uniwind';

import { ScreenChromeProvider } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isString } from '@rnw-community/shared';

import { SCREEN_CHROME_CONFIG } from '../constant/screen-chrome-config.constant';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly syncNativeScrollOffset?: boolean;
    readonly config?: ScreenChromeConfigOverridesInterface;
}

const FADE_SOLID_CLASSNAME = 'bg-surface/70 dark:bg-surface/65';
const FADE_WASH_CLASSNAME = 'bg-surface/5';

export const ScreenChromeThemeProvider = ({ children, syncNativeScrollOffset, config = SCREEN_CHROME_CONFIG }: Props) => {
    const { theme } = useUniwind();
    const { backgroundColor: solid } = useResolveClassNames(FADE_SOLID_CLASSNAME);
    const { backgroundColor: wash } = useResolveClassNames(FADE_WASH_CLASSNAME);
    const surfaceColors = isString(solid) && isString(wash) ? { solid, wash } : null;
    const surfaceConfig = isDefined(surfaceColors) ? { ...config, colors: { light: surfaceColors, dark: surfaceColors } } : config;

    return (
        <ScreenChromeProvider colorScheme={theme} config={surfaceConfig} syncNativeScrollOffset={syncNativeScrollOffset}>
            {children}
        </ScreenChromeProvider>
    );
};
