import { ScreenChromeProvider } from '@rnw-community/react-native-screen-chrome';

import { useThemeContext } from '../../theme/context/theme.context';
import { SCREEN_CHROME_CONFIG } from '../constant/screen-chrome-config.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ScreenChromeThemeProvider = ({ children }: Props) => {
    const { isDarkColorSchema } = useThemeContext();

    const colorScheme = isDarkColorSchema ? 'dark' : 'light';

    return (
        <ScreenChromeProvider colorScheme={colorScheme} config={SCREEN_CHROME_CONFIG}>
            {children}
        </ScreenChromeProvider>
    );
};
