import { ComponentProps } from 'react';
import { Switch } from 'react-native';

export const ThemedSwitch = (props: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => (
    <Switch
        {...props}
        thumbColorClassName="accent-primary"
        trackColorOnClassName="accent-secondary-foreground"
        trackColorOffClassName="accent-secondary-corner"
        ios_backgroundColorClassName="accent-secondary-corner"
    />
);
