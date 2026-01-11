import { ComponentProps } from 'react';
import { Switch } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';
import { dark, light } from '../../../theme/provider/theme.provider';

export const ThemedSwitch = (props: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => {
    const { isDarkColorSchema } = useThemeContext();

    const theme = isDarkColorSchema ? dark : light;
    const trackColor = {
        true: theme['--color-secondary-foreground'],
        false: theme['--color-secondary-corner']
    };

    return (
        <Switch
            {...props}
            trackColor={trackColor}
            thumbColor={theme['--color-primary']}
            ios_backgroundColor={theme['--color-secondary-corner']}
        />
    );
};
