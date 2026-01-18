import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly children: ReactNode;
    readonly withBlur?: boolean;
}

export const Footer = ({ children, withBlur = false }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const style = withBlur ? {} : { paddingBottom: bottom };

    return (
        <View className={cn('gap-md pt-xl px-7xl', !withBlur && 'border-t border-t-secondary-corner bg-primary-reverse')} style={style}>
            {children}
        </View>
    );
};
