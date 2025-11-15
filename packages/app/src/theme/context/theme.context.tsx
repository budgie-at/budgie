import { ThemeEnum } from '@budgie/contracts';
import React, { createContext } from 'react';
import { Appearance, Platform, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { useGetSettingsQuery } from '../../settings/query/use-get-settings.query';
import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { OnEventFn } from '@rnw-community/shared';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

interface ThemeContextInterface {
    isDarkColorSchema: boolean;
    colorScheme: ColorSchemaEnum;
    toggleColorSchema: OnEventFn;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    colorScheme: ColorSchemaEnum.Light,
    toggleColorSchema: emptyFn,
    isDarkColorSchema: false
});

export const ThemeProvider = ({ children }: Props) => {
    const { settings } = useGetSettingsQuery();

    const isDarkColorSchema = settings.theme === ThemeEnum.DARK;

    const colorScheme = isDarkColorSchema ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;

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
            <View className={`flex-1 ${isDarkColorSchema ? 'dark' : 'light'}`}>{children}</View>
        </ThemeContext.Provider>
    );
};
