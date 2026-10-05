import { useUniwind } from 'uniwind';

import { ScreenChromeProvider } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONFIG } from '../constant/screen-chrome-config.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly syncNativeScrollOffset?: boolean;
}

export const ScreenChromeThemeProvider = ({ children, syncNativeScrollOffset }: Props) => {
    const { theme } = useUniwind();

    return (
        <ScreenChromeProvider colorScheme={theme} config={SCREEN_CHROME_CONFIG} syncNativeScrollOffset={syncNativeScrollOffset}>
            {children}
        </ScreenChromeProvider>
    );
};
