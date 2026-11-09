import { useUniwind } from 'uniwind';

import { ScreenChromeProvider } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONFIG } from '../constant/screen-chrome-config.constant';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly syncNativeScrollOffset?: boolean;
    readonly config?: ScreenChromeConfigOverridesInterface;
}

export const ScreenChromeThemeProvider = ({ children, syncNativeScrollOffset, config = SCREEN_CHROME_CONFIG }: Props) => {
    const { theme } = useUniwind();

    return (
        <ScreenChromeProvider colorScheme={theme} config={config} syncNativeScrollOffset={syncNativeScrollOffset}>
            {children}
        </ScreenChromeProvider>
    );
};
