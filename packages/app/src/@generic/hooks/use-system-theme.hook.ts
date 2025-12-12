import { useEffect, useState } from 'react';
import { AppState, Appearance, ColorSchemeName } from 'react-native';

export const useSystemTheme = (): ColorSchemeName => {
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

    useEffect(() => {
        const syncScheme = () => {
            setSystemScheme(Appearance.getColorScheme());
        };

        const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme(colorScheme);
        });

        const appStateSubscription = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') {
                syncScheme();
            }
        });

        syncScheme();

        return () => {
            appearanceSubscription.remove();
            appStateSubscription.remove();
        };
    }, []);

    return systemScheme;
};
