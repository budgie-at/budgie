import { ThemeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useLayoutEffect } from 'react';
import { Appearance, StatusBar, View } from 'react-native';
import { Uniwind, useResolveClassNames, useUniwind } from 'uniwind';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
    const theme = useSetting('theme');
    const { theme: activeTheme } = useUniwind();
    const { backgroundColor } = useResolveClassNames('bg-primary-reverse');

    const manualColorScheme = theme === ThemeEnum.DARK ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;
    const uniwindTheme = theme === ThemeEnum.SYSTEM ? 'system' : manualColorScheme;
    const nativeColorScheme = theme === ThemeEnum.SYSTEM ? 'unspecified' : manualColorScheme;
    const isDark = activeTheme === 'dark';
    const barStyle = isDark ? 'light-content' : 'dark-content';
    const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
    const background = backgroundColor ?? baseNavigationTheme.colors.background;
    const navigationTheme = {
        ...baseNavigationTheme,
        colors: { ...baseNavigationTheme.colors, background, card: background }
    };

    useLayoutEffect(() => {
        Uniwind.setTheme(uniwindTheme);
        Appearance.setColorScheme(nativeColorScheme);
    }, [uniwindTheme, nativeColorScheme]);

    useLayoutEffect(() => {
        appRuntime.runFork(Effect.promise(() => SystemUI.setBackgroundColorAsync(background)));
    }, [background]);

    return (
        <NavigationThemeProvider value={navigationTheme}>
            <StatusBar barStyle={barStyle} />
            <View className="flex-1">{children}</View>
        </NavigationThemeProvider>
    );
};
