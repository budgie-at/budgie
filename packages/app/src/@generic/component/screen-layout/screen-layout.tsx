import { ReactNode, useEffect } from 'react';
import { View } from 'react-native';

import type { ParamListBase, RouteProp } from 'expo-router/react-navigation';

interface Props {
    readonly route: Pick<RouteProp<ParamListBase>, 'name'>;
    readonly children: ReactNode;
}

export const ScreenLayout = ({ route, children }: Props) => {
    useEffect(() => {
        performance.mark(`budgie:screen:${route.name}`);
    }, [route.name]);

    return <View className="flex-1 bg-primary-reverse">{children}</View>;
};
