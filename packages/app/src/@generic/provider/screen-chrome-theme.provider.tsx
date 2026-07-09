import { ColorSchemeEnum, ScreenChromeProvider } from '@budgie/screen-chrome';

import { useThemeContext } from '../../theme/context/theme.context';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const SCREEN_CHROME_CONFIG = { topFadeHeight: 112, bottomFadeHeight: 112 };

export const ScreenChromeThemeProvider = ({ children }: Props) => {
    const { isDarkColorSchema } = useThemeContext();

    const colorScheme = isDarkColorSchema ? ColorSchemeEnum.Dark : ColorSchemeEnum.Light;

    return (
        <ScreenChromeProvider colorScheme={colorScheme} config={SCREEN_CHROME_CONFIG}>
            {children}
        </ScreenChromeProvider>
    );
};
