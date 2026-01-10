import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { cn } from '../../utils/cn.util';

import type { ComponentProps, ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof View> {
    readonly safeEdges?: Edge[];
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
    readonly withFloatingTabBar?: boolean;
}

const DEFAULT_SAFE_EDGES: Edge[] = ['top'];

export const Page = ({
    className,
    header,
    footer,
    children,
    safeEdges = DEFAULT_SAFE_EDGES,
    contentClassName,
    withFloatingTabBar = false,
    ...rest
}: Props) => {
    const { top, left, right, bottom } = useSafeAreaInsets();

    const floatingTabBarInset = withFloatingTabBar ? FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom : 0;

    const style = {
        ...(safeEdges.includes('top') ? { paddingTop: top } : {}),
        ...(safeEdges.includes('left') ? { paddingLeft: left } : {}),
        ...(safeEdges.includes('right') ? { paddingRight: right } : {}),
        ...(safeEdges.includes('bottom') ? { paddingBottom: bottom } : {})
    };

    const contentStyle = { paddingBottom: floatingTabBarInset };

    return (
        <View {...rest} className={cn('flex-1', className)} style={style}>
            {header}
            <View className={cn('px-5xl flex-1', contentClassName)} style={contentStyle}>
                {children}
            </View>
            {footer}
        </View>
    );
};
