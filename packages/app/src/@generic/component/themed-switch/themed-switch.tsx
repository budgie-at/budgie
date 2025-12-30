import { ComponentProps } from 'react';
import { Switch } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';
import { PRIMARY_COLOR, PRIMARY_COLOR_REVERSE } from '../../constant/colors.constant';

const getThumbColor = (isDarkTheme: boolean, value: boolean) => {
    if (isDarkTheme) {
        return value ? PRIMARY_COLOR_REVERSE : PRIMARY_COLOR;
    }

    return value ? PRIMARY_COLOR : PRIMARY_COLOR_REVERSE;
};

const getBackgroundColor = (isDarkTheme: boolean, value: boolean) => {
    if (isDarkTheme) {
        return value ? PRIMARY_COLOR : PRIMARY_COLOR_REVERSE;
    }

    return value ? PRIMARY_COLOR_REVERSE : PRIMARY_COLOR;
};

export const ThemedSwitch = (props: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => {
    const { isDarkColorSchema } = useThemeContext();

    const thumbColor = getThumbColor(isDarkColorSchema, props.value ?? false);
    const iosBackgroundColor = getBackgroundColor(isDarkColorSchema, props.value ?? false);

    const trackColor = {
        true: getBackgroundColor(isDarkColorSchema, true),
        false: getBackgroundColor(isDarkColorSchema, false)
    };

    return <Switch {...props} trackColor={trackColor} thumbColor={thumbColor} ios_backgroundColor={iosBackgroundColor} />;
};
