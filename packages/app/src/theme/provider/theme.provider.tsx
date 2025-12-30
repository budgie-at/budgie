import { ThemeEnum } from '@budgie/contracts';
import { VariableContextProvider, useColorScheme } from 'nativewind';
import { Appearance, Platform, StatusBar, View } from 'react-native';

import { useSystemTheme } from '../../@generic/hook/use-system-theme.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { ThemeContext } from '../context/theme.context';
import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { ReactNode } from 'react';

const light = {
    '--color-primary': 'rgb(0, 0, 0)',
    '--color-primary-reverse': 'rgb(255, 255, 255)',
    '--color-secondary-foreground': 'rgba(115, 115, 115, 1)',
    '--color-secondary-corner': 'rgba(229, 229, 229, 1)',
    '--color-secondary-background': 'rgba(248, 248, 248, 1)',
    '--color-secondary-reverse-foreground': 'rgba(136, 136, 136, 1)',
    '--color-secondary-reverse-corner': 'rgba(34, 34, 34, 1)',
    '--color-secondary-reverse-background': 'rgba(10, 10, 10, 1)',
    '--color-positive-foreground': 'rgba(16, 185, 129, 1)',
    '--color-positive-corner': 'rgba(16, 185, 129, 0.2)',
    '--color-positive-background': 'rgba(16, 185, 129, 0.1)',
    '--color-destructive-foreground': 'rgba(239, 68, 68, 1)',
    '--color-destructive-corner': 'rgba(239, 68, 68, 0.2)',
    '--color-destructive-background': 'rgba(239, 68, 68, 0.1)',
    '--color-warning-foreground': 'rgba(240, 177, 0, 1)',
    '--color-warning-corner': 'rgba(240, 177, 0, 0.2)',
    '--color-warning-background': 'rgba(240, 177, 0, 0.1)',
    '--color-dark-warning-foreground': 'rgba(255, 105, 0, 1)',
    '--color-dark-warning-corner': 'rgba(255, 105, 0, 0.20)',
    '--color-dark-warning-background': 'rgba(255, 105, 0, 0.1)',
    '--color-default-foreground': 'rgba(43, 127, 255, 1)',
    '--color-default-corner': 'rgba(43, 127, 255, 0.2)',
    '--color-default-background': 'rgba(43, 127, 255, 0.1)',
    '--color-ghost-foreground': 'rgba(0, 0, 0, 1)',
    '--color-ghost-corner': 'rgba(0, 0, 0, 0.2)',
    '--color-ghost-background': 'rgba(10, 10, 10, 0.05)',
    '--color-pink-foreground': 'rgba(246, 51, 154, 0.7)',
    '--color-pink-corner': 'rgba(246, 51, 154, 0.2)',
    '--color-pink-background': 'rgba(246, 51, 154, 0.1)',
    '--color-corner': 'rgba(229, 229, 229, 1)',
    '--color-separator': 'linear-gradient(90deg, rgba(0, 0, 0, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%)'
};

const dark = {
    '--color-primary': 'rgb(255, 255, 255)',
    '--color-primary-reverse': 'rgb(0, 0, 0)',
    '--color-secondary-foreground': 'rgba(136, 136, 136, 1)',
    '--color-secondary-corner': 'rgba(34, 34, 34, 1)',
    '--color-secondary-background': 'rgba(10, 10, 10, 1)',
    '--color-secondary-reverse-foreground': 'rgba(115, 115, 115, 1)',
    '--color-secondary-reverse-corner': 'rgba(229, 229, 229, 1)',
    '--color-secondary-reverse-background': 'rgba(248, 248, 248, 1)',
    '--color-positive-foreground': 'rgba(0, 255, 136, 1)',
    '--color-positive-corner': 'rgba(1, 255, 136, 0.20)',
    '--color-positive-background': 'rgba(1, 255, 136, 0.10)',
    '--color-destructive-foreground': 'rgba(255, 68, 68, 1)',
    '--color-destructive-corner': 'rgba(255, 107, 107, 0.20)',
    '--color-destructive-background': 'rgba(255, 68, 68, 0.20)',
    '--color-warning-foreground': 'rgba(240, 177, 0, 1)',
    '--color-warning-corner': 'rgba(240, 177, 0, 0.20)',
    '--color-warning-background': 'rgba(240, 177, 0, 0.1)',
    '--color-dark-warning-foreground': 'rgba(255, 105, 0, 1)',
    '--color-dark-warning-corner': 'rgba(255, 105, 0, 0.20)',
    '--color-dark-warning-background': 'rgba(255, 105, 0, 0.1)',
    '--color-default-foreground': 'rgba(43, 127, 255, 1)',
    '--color-default-corner': 'rgba(43, 127, 255, 0.2)',
    '--color-default-background': 'rgba(43, 127, 255, 0.1)',
    '--color-ghost-foreground': 'rgba(255, 255, 255, 1)',
    '--color-ghost-corner': 'rgba(255, 255, 255, 0.2)',
    '--color-ghost-background': 'rgba(255, 255, 255, 0.05)',
    '--color-pink-foreground': 'rgba(246, 51, 154, 0.7)',
    '--color-pink-corner': 'rgba(246, 51, 154, 0.2)',
    '--color-pink-background': 'rgba(246, 51, 154, 0.1)',
    '--color-corner': 'rgba(34, 34, 34, 1)',
    '--color-separator': 'linear-gradient(90deg, rgba(255, 255, 255, 0.40) 0%, rgba(0, 0, 0, 0.00) 100%)'
};

interface Props {
    readonly children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
    const theme = useSetting('theme');
    const handler = useColorScheme();
    const systemScheme = useSystemTheme();

    const isSystemDark = systemScheme === 'dark';
    const isManuallyDark = theme === ThemeEnum.DARK;
    const isSystemTheme = theme === ThemeEnum.SYSTEM;

    const shouldUseDarkTheme = isManuallyDark || (isSystemTheme && isSystemDark);

    const colorScheme = shouldUseDarkTheme ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;
    const barStyle = shouldUseDarkTheme ? 'light-content' : 'dark-content';

    const getNextTheme = (): ThemeEnum => {
        if (isSystemTheme) {
            return shouldUseDarkTheme ? ThemeEnum.LIGHT : ThemeEnum.DARK;
        }

        return isManuallyDark ? ThemeEnum.LIGHT : ThemeEnum.DARK;
    };

    const toggleColorSchema = async () => {
        const nextTheme = getNextTheme();
        handler.toggleColorScheme();
        await updateSettingsMutation({ theme: nextTheme });

        if (nextTheme === ThemeEnum.SYSTEM || Platform.OS === 'web') {
            return;
        }

        const nativeScheme = nextTheme === ThemeEnum.DARK ? 'dark' : 'light';
        Appearance.setColorScheme(nativeScheme);
    };

    const contextValue = {
        colorScheme,
        isDarkColorSchema: shouldUseDarkTheme,
        toggleColorSchema
    };

    const styles = shouldUseDarkTheme ? dark : light;

    return (
        <VariableContextProvider value={styles}>
            <ThemeContext.Provider value={contextValue}>
                <StatusBar barStyle={barStyle} />
                <View className="flex-1">{children}</View>
            </ThemeContext.Provider>
        </VariableContextProvider>
    );
};
