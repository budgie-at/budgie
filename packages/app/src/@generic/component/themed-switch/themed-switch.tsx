import { ComponentProps } from 'react';
import { Switch } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';

const LIGHT_THEME = {
    thumbOn: '#ffffff',
    thumbOff: '#ffffff',
    trackOn: '#000000',
    trackOff: '#e5e5e5'
};

const DARK_THEME = {
    thumbOn: '#000000',
    thumbOff: '#000000',
    trackOn: '#ffffff',
    trackOff: '#3a3a3c'
};

const getThumbColor = (isDarkTheme: boolean, value: boolean) => {
    const theme = isDarkTheme ? DARK_THEME : LIGHT_THEME;

    return value ? theme.thumbOn : theme.thumbOff;
};

const getTrackColor = (isDarkTheme: boolean, value: boolean) => {
    const theme = isDarkTheme ? DARK_THEME : LIGHT_THEME;

    return value ? theme.trackOn : theme.trackOff;
};

export const ThemedSwitch = (props: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => {
    const { isDarkColorSchema } = useThemeContext();

    const thumbColor = getThumbColor(isDarkColorSchema, props.value ?? false);
    const iosBackgroundColor = getTrackColor(isDarkColorSchema, props.value ?? false);

    const trackColor = {
        true: getTrackColor(isDarkColorSchema, true),
        false: getTrackColor(isDarkColorSchema, false)
    };

    return <Switch {...props} trackColor={trackColor} thumbColor={thumbColor} ios_backgroundColor={iosBackgroundColor} />;
};
