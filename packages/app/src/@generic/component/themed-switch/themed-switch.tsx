import { ComponentProps } from 'react';
import { Switch } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';
import { PRIMARY_COLOR, PRIMARY_COLOR_REVERSE, SWITCH_TRACK_OFF_DARK, SWITCH_TRACK_OFF_LIGHT } from '../../constant/colors.constant';

const LIGHT_THEME = {
    thumbOn: PRIMARY_COLOR,
    thumbOff: PRIMARY_COLOR,
    trackOn: PRIMARY_COLOR_REVERSE,
    trackOff: SWITCH_TRACK_OFF_LIGHT
};

const DARK_THEME = {
    thumbOn: PRIMARY_COLOR_REVERSE,
    thumbOff: PRIMARY_COLOR_REVERSE,
    trackOn: PRIMARY_COLOR,
    trackOff: SWITCH_TRACK_OFF_DARK
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
