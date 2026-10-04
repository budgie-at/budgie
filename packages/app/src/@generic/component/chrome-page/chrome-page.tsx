import { cn } from 'cn';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EdgeFade } from '../edge-fade/edge-fade';
import { PAGE_DEFAULT_SAFE_EDGES, pageGetSafeEdgeClassName } from '../page/utils/page-get-safe-edge-class-name.util';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

import type { PageChromePropsInterface } from '../page/interface/page-chrome-props.interface';

export const ChromePage = (props: PageChromePropsInterface) => {
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

    const contentSafeEdgeClassName = pageGetSafeEdgeClassName(safeEdges.filter(edge => edge !== 'top'));
    const headerSafeEdgeClassName = pageGetSafeEdgeClassName(safeEdges);

    return (
        <>
            <View {...rest} collapsable={collapsable} className={cn('relative flex-1', className, contentSafeEdgeClassName)} style={style}>
                <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>
            </View>

            <EdgeFade position="top" />
            <View className={cn('absolute top-0 right-0 left-0 z-3', headerSafeEdgeClassName)}>{header}</View>

            {isDefined(footer) ? <StickyFooterBand>{footer}</StickyFooterBand> : null}
        </>
    );
};
