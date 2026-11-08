import { ComponentProps } from 'react';
import { Switch, View } from 'react-native';

import { useVibration } from '../../hook/use-vibration.hook';
import { cn } from '../../utils/cn.util';

export const ThemedSwitch = ({
    className,
    onValueChange,
    ...props
}: Omit<ComponentProps<typeof Switch>, 'thumbColor' | 'ios_backgroundColor' | 'trackColor'>) => {
    const [, , hapticSelection] = useVibration();

    const handleValueChange = (value: boolean) => {
        hapticSelection();
        void onValueChange?.(value);
    };

    return (
        <View className={cn('ios:h-[28px] ios:justify-start', className)}>
            <Switch {...props} onValueChange={handleValueChange} />
        </View>
    );
};
