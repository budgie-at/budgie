import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { EdgeFade } from '../edge-fade/edge-fade';
import { PAGE_DEFAULT_SAFE_EDGES, pageGetSafeEdgeStyle } from '../page/utils/page-get-safe-edge-style.util';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

import type { PageChromePropsInterface } from '../page/interface/page-chrome-props.interface';

const CHROME_PAGE_Z_INDEX = 3;

export const ChromePage = (props: PageChromePropsInterface) => {
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
    const contentSafeEdges = safeEdges.filter(edge => edge !== 'top');
    const contentStyle = [pageGetSafeEdgeStyle(contentSafeEdges, insets), styleProp];
    const headerStyle = { ...pageGetSafeEdgeStyle(safeEdges, insets), zIndex: CHROME_PAGE_Z_INDEX };

    return (
        <>
            <View {...rest} collapsable={collapsable} className={cn('relative flex-1', className)} style={contentStyle}>
                <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>
            </View>

            <EdgeFade position="top" />
            <View className="absolute top-0 right-0 left-0" style={headerStyle}>
                {header}
            </View>

            {isDefined(footer) ? <StickyFooterBand>{footer}</StickyFooterBand> : null}
        </>
    );
};
