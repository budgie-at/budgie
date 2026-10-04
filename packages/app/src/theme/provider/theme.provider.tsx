import { ThemeEnum } from '@budgie/contracts';
import { useLayoutEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

import { appRuntime } from '../../@generic/runtime/app.runtime';
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
    const { theme: activeTheme } = useUniwind();

    const manualColorScheme = theme === ThemeEnum.DARK ? ColorSchemaEnum.Dark : ColorSchemaEnum.Light;
    const uniwindTheme = theme === ThemeEnum.SYSTEM ? 'system' : manualColorScheme;
    const isDarkColorSchema = activeTheme === 'dark';
    const barStyle = isDarkColorSchema ? 'light-content' : 'dark-content';

    const toggleColorSchema = async () => {
        Uniwind.setTheme(isDarkColorSchema ? ColorSchemaEnum.Light : ColorSchemaEnum.Dark);
        await appRuntime.runPromise(updateSettingsMutation({ theme: isDarkColorSchema ? ThemeEnum.LIGHT : ThemeEnum.DARK }));
    };

    const contextValue = {
        isDarkColorSchema,
        toggleColorSchema
    };

    useLayoutEffect(() => {
        Uniwind.setTheme(uniwindTheme);
    }, [uniwindTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <StatusBar barStyle={barStyle} />
            <View className="flex-1">{children}</View>
        </ThemeContext.Provider>
    );
};
