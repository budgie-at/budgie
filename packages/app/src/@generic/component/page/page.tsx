import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

import { PAGE_DEFAULT_SAFE_EDGES, pageGetSafeEdgeClassName } from './utils/page-get-safe-edge-class-name.util';

import type { PageChromePropsInterface } from './interface/page-chrome-props.interface';

export const Page = (props: PageChromePropsInterface) => {
    const {
        className,
        header,
        footer,
        children,
        safeEdges = PAGE_DEFAULT_SAFE_EDGES,
        contentClassName,
        collapsable = false,
        style,
        ...rest
    } = props;

    return (
        <View
            {...rest}
            collapsable={collapsable}
            className={cn('relative flex-1', className, pageGetSafeEdgeClassName(safeEdges))}
            style={style}
        >
            {header}

            <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>

            {footer}
        </View>
    );
};
