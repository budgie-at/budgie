import { ThemeEnum } from '@budgie/contracts';
import { useLayoutEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

import { useSetting } from '../../settings/hook/use-setting.hook';
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
    const barStyle = activeTheme === 'dark' ? 'light-content' : 'dark-content';

    useLayoutEffect(() => {
        Uniwind.setTheme(uniwindTheme);
    }, [uniwindTheme]);

    return (
        <>
            <StatusBar barStyle={barStyle} />
            <View className="flex-1">{children}</View>
        </>
    );
};
