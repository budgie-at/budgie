import { ComponentProps } from 'react';
import { Switch, View } from 'react-native';

import { cn } from '../../utils/cn.util';

export const ThemedSwitch = ({
    className,
    value,
    ...props
}: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => {
    const thumbColorClassName = value === true ? 'accent-cta-foreground' : 'accent-white';

    return (
        <View className={cn('ios:h-[28px] ios:justify-start', className)}>
            <Switch
                {...props}
                value={value}
                thumbColorClassName={thumbColorClassName}
                trackColorOnClassName="accent-cta-background"
                trackColorOffClassName="accent-secondary-corner"
                ios_backgroundColorClassName="accent-secondary-corner"
            />
        </View>
    );
};
