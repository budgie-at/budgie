import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import { PAGE_DEFAULT_SAFE_EDGES, pageGetSafeEdgeStyle } from './utils/page-get-safe-edge-style.util';

import type { ComponentProps, ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof View> {
    readonly safeEdges?: Edge[];
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
}

export const Page = (props: Props) => {
    const {
        className,
        header,
        footer,
        children,
        safeEdges = PAGE_DEFAULT_SAFE_EDGES,
        contentClassName,
        collapsable = false,
        ...rest
    } = props;

    const insets = useSafeAreaInsets();
    const style = pageGetSafeEdgeStyle(safeEdges, insets);

    return (
        <View {...rest} collapsable={collapsable} className={cn('relative flex-1', className)} style={style}>
            {header}

            <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>

            {footer}
        </View>
    );
};
