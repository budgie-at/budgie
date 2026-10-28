import { ReactNode } from 'react';
import { View } from 'react-native';

import { ScreenPerformanceMark } from '../screen-performance-mark/screen-performance-mark';

import type { ParamListBase, RouteProp } from 'expo-router/react-navigation';

interface Props {
    readonly route: Pick<RouteProp<ParamListBase>, 'name'>;
    readonly children: ReactNode;
}

export const ScreenLayout = ({ route, children }: Props) => (
    <View className="flex-1 bg-primary-reverse">
        <ScreenPerformanceMark routeName={route.name} />
        {children}
    </View>
);
