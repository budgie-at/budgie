import { ThemeEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { Switch } from 'react-native';

import { useSetting } from '../../../settings/hook/use-setting.hook';
import { PRIMARY_COLOR, PRIMARY_REVERSE_COLOR } from '../../constant/colors.constant';

const getThumbColor = (isDarkTheme: boolean, value: boolean) => {
    if (isDarkTheme) {
        return value ? PRIMARY_REVERSE_COLOR : PRIMARY_COLOR;
    }

    return value ? PRIMARY_COLOR : PRIMARY_REVERSE_COLOR;
};

export const ThemedSwitch = (props: ComponentProps<typeof Switch>) => {
    const theme = useSetting('theme');
    const isDarkTheme = theme === ThemeEnum.DARK;

    const thumbColor = getThumbColor(isDarkTheme, props.value ?? false);
    const iosBackgroundColor = isDarkTheme ? PRIMARY_REVERSE_COLOR : PRIMARY_COLOR;

    const trackColor = {
        true: isDarkTheme ? PRIMARY_COLOR : PRIMARY_REVERSE_COLOR,
        false: isDarkTheme ? PRIMARY_REVERSE_COLOR : PRIMARY_COLOR
    };

    return (
        <Switch
            {...props}
            trackColor={props.trackColor ?? trackColor}
            thumbColor={props.thumbColor ?? thumbColor}
            ios_backgroundColor={props.ios_backgroundColor ?? iosBackgroundColor}
        />
    );
};
