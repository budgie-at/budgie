import { ThemeEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { Switch } from 'react-native';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { PRIMARY_COLOR, PRIMARY_REVERSE_COLOR } from '../../constant/colors.constant';

export const ThemedSwitch = (props: ComponentProps<typeof Switch>) => {
    const { settings } = useSettingsContext()
    const isDarkTheme = settings.theme === ThemeEnum.DARK

    const thumbColor = isDarkTheme ? PRIMARY_COLOR : PRIMARY_REVERSE_COLOR;
    const iosBackgroundColor = isDarkTheme ? PRIMARY_REVERSE_COLOR : PRIMARY_COLOR;

    const trackColor = {
        false: isDarkTheme ? PRIMARY_COLOR : PRIMARY_REVERSE_COLOR,
        true: isDarkTheme ? PRIMARY_REVERSE_COLOR : PRIMARY_COLOR
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
