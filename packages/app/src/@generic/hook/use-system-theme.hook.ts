import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

import { useAppState } from './use-app-state.hook';

export const useSystemTheme = (): ColorSchemeName => {
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');

    useEffect(() => {
        const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme(colorScheme);
        });

        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        setSystemScheme(Appearance.getColorScheme() ?? 'light');

        return () => {
            appearanceSubscription.remove();
        };
    }, []);
    useAppState(isActive => {
        if (isActive) {
            setSystemScheme(Appearance.getColorScheme() ?? 'light');
        }
    });

    return systemScheme;
};
