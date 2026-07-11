import { ColorSchemeEnum, ScreenChromeConfigOverridesInterface, ScreenChromeProvider } from '@budgie/screen-chrome';

import { useThemeContext } from '../../theme/context/theme.context';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly config?: ScreenChromeConfigOverridesInterface;
}

export const ScreenChromeThemeProvider = ({ children, config }: Props) => {
    const { isDarkColorSchema } = useThemeContext();

    const colorScheme = isDarkColorSchema ? ColorSchemeEnum.Dark : ColorSchemeEnum.Light;

    return (
        <ScreenChromeProvider colorScheme={colorScheme} config={config}>
            {children}
        </ScreenChromeProvider>
    );
};
