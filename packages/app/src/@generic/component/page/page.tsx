import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import { PAGE_DEFAULT_SAFE_EDGES, pageGetSafeEdgeStyle } from './utils/page-get-safe-edge-style.util';

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
        style: styleProp,
        ...rest
    } = props;

    const insets = useSafeAreaInsets();
    const style = [pageGetSafeEdgeStyle(safeEdges, insets), styleProp];

    return (
        <View {...rest} collapsable={collapsable} className={cn('relative flex-1', className)} style={style}>
            {header}

            <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>

            {footer}
        </View>
    );
};
