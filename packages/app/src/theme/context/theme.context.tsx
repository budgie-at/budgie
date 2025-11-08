import React, { createContext } from 'react';
import { Appearance, Platform, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { useAppDispatch } from '../../@generic/hooks/use-app-dispatch.hook';
import { useAppSelector } from '../../@generic/hooks/use-app-selector.hook';
import { settingsSetAction } from '../../settings/store/settings.actions';
import { settingsKeySelector } from '../../settings/store/settings.selectors';
import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { OnEventFn } from '@rnw-community/shared';
import type { ReactNode } from 'react';

export interface ThemeContextInterface {
    isDarkColorSchema: boolean;
    colorScheme: ColorSchemaEnum;
    toggleColorSchema: OnEventFn;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    colorScheme: ColorSchemaEnum.Light,
    toggleColorSchema: emptyFn,
    isDarkColorSchema: false
});

export const ThemeProvider = ({ children }: { readonly children: ReactNode }) => {
    const dispatch = useAppDispatch();
    const isDarkColorSchema = useAppSelector(settingsKeySelector('isDarkColorSchema'));

    const colorScheme = isDarkColorSchema ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;

    const toggleColorSchema = () => {
        const newColorScheme = colorScheme === ColorSchemaEnum.Dark ? ColorSchemaEnum.Light : ColorSchemaEnum.Dark;

        if (newColorScheme !== colorScheme) {
            dispatch(settingsSetAction({ isDarkColorSchema: !isDarkColorSchema }));

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
