import { ThemeEnum } from '@budgie/contracts';
import { Appearance, Platform, StatusBar, View } from 'react-native';

import { useSystemTheme } from '../../@generic/hooks/use-system-theme.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { ThemeContext } from '../context/theme.context';
import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
    const theme = useSetting('theme');
    const systemScheme = useSystemTheme();
    const isSystemDark = systemScheme === 'dark';

    const isManuallyDark = theme === ThemeEnum.DARK;
    const isSystemTheme = theme === ThemeEnum.SYSTEM;

    const shouldUseDarkTheme = isManuallyDark || (isSystemTheme && isSystemDark);

    const colorScheme = shouldUseDarkTheme ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;
    const barStyle = shouldUseDarkTheme ? 'light-content' : 'dark-content';
    const rootClass = shouldUseDarkTheme ? 'dark' : 'light';

    const getNextTheme = (): ThemeEnum => {
        if (isSystemTheme) {
            return shouldUseDarkTheme ? ThemeEnum.LIGHT : ThemeEnum.DARK;
        }

        return isManuallyDark ? ThemeEnum.LIGHT : ThemeEnum.DARK;
    };

    const toggleColorSchema = async () => {
        const nextTheme = getNextTheme();
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

    return (
        <ThemeContext.Provider value={contextValue}>
            <StatusBar barStyle={barStyle} />
            <View className={`flex-1 ${rootClass}`}>{children}</View>
        </ThemeContext.Provider>
    );
};
