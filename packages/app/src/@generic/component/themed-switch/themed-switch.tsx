import { ComponentProps } from 'react';
import { Switch, View } from 'react-native';

import { cn } from '../../utils/cn.util';

export const ThemedSwitch = ({
    className,
    ...props
}: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => (
    <View className={cn('ios:h-[28px] ios:justify-start', className)}>
        <Switch
            {...props}
            thumbColorClassName="accent-white"
            trackColorOnClassName="accent-positive-action"
            trackColorOffClassName="accent-secondary-corner"
            ios_backgroundColorClassName="accent-secondary-corner"
        />
    </View>
);
