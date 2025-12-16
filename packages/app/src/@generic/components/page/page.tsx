import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import type { ComponentProps, ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof View> {
    readonly safeEdges?: Edge[];
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
}

const DEFAULT_SAFE_EDGES: Edge[] = ['top'];

export const Page = ({ className, header, footer, children, safeEdges = DEFAULT_SAFE_EDGES, contentClassName, ...rest }: Props) => {
    const { top, left, right, bottom } = useSafeAreaInsets();

    const style = {
        ...(safeEdges.includes('top') ? { paddingTop: top } : {}),
        ...(safeEdges.includes('left') ? { paddingLeft: left } : {}),
        ...(safeEdges.includes('right') ? { paddingRight: right } : {}),
        ...(safeEdges.includes('bottom') ? { paddingBottom: bottom } : {})
    };

    return (
        <View {...rest} className={cn('flex-1', className)} style={style}>
            {header}
            <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>
            {footer}
        </View>
    );
};
