import { ComponentProps } from 'react';
import { Switch, View } from 'react-native';

import { cn } from '../../utils/cn.util';

export const ThemedSwitch = ({
    className,
    ...props
}: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => (
    <View className={cn('justify-center', className)}>
        <Switch
            {...props}
            trackColorOnClassName="accent-switch-on"
            trackColorOffClassName="accent-secondary-corner"
            ios_backgroundColorClassName="accent-secondary-corner"
        />
    </View>
);
