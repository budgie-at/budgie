import { ThemeEnum } from '@budgie/contracts';
import React from 'react';
import { Appearance, Platform, StatusBar, View } from 'react-native';

import { useSettingsContext } from '../../settings/context/settings.context';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { ThemeContext } from '../context/theme.context';
import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
    const { settings } = useSettingsContext();

    const isDarkColorSchema = settings.theme === ThemeEnum.DARK;

    const colorScheme = isDarkColorSchema ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;

    const barStyle = isDarkColorSchema ? 'light-content' : 'dark-content';

    const toggleColorSchema = async () => {
        const newColorScheme = colorScheme === ColorSchemaEnum.Dark ? ColorSchemaEnum.Light : ColorSchemaEnum.Dark;

        if (newColorScheme !== colorScheme) {
            await updateSettingsMutation({ theme: isDarkColorSchema ? ThemeEnum.LIGHT : ThemeEnum.DARK });

            // HINT: https://reactnavigation.org/docs/themes/?config=static#keeping-the-native-theme-in-sync
            if (Platform.OS === 'web') {
                document.documentElement.style.colorScheme = newColorScheme;
            } else {
                Appearance.setColorScheme(newColorScheme);
            }
        }
    };

    const contextValue = { colorScheme, toggleColorSchema, isDarkColorSchema };

    return (
        <ThemeContext.Provider value={contextValue}>
            <StatusBar barStyle={barStyle} />
            <View className={`flex-1 ${isDarkColorSchema ? 'dark' : 'light'}`}>{children}</View>
        </ThemeContext.Provider>
    );
};
