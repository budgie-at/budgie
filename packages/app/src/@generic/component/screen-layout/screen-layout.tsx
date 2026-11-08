import { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { ScreenPerformanceMark } from '../screen-performance-mark/screen-performance-mark';

import type { NativeStackNavigationOptions } from 'expo-router';
import type { ParamListBase, RouteProp } from 'expo-router/react-navigation';

interface Props {
    readonly route: Pick<RouteProp<ParamListBase>, 'name'>;
    readonly options: Pick<NativeStackNavigationOptions, 'presentation'>;
    readonly children: ReactNode;
}

export const ScreenLayout = ({ route, options, children }: Props) => {
    const className = cn('flex-1', options.presentation !== 'transparentModal' && 'bg-primary-reverse');

    return (
        <View className={className}>
            <ScreenPerformanceMark routeName={route.name} />
            {children}
        </View>
    );
};
