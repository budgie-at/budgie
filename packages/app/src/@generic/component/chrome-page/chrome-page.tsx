import { EdgeFade } from '@budgie/screen-chrome';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { PAGE_DEFAULT_SAFE_EDGES, pageGetSafeEdgeStyle } from '../page/utils/page-get-safe-edge-style.util';

import type { ComponentProps, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof View> {
    readonly safeEdges?: Edge[];
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
}

const CHROME_PAGE_Z_INDEX = 3;
const CHROME_PAGE_FOOTER_STICKY_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;

export const ChromePage = (props: Props) => {
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
    const { bottom } = insets;
    const contentSafeEdges = safeEdges.filter(edge => edge !== 'top');
    const contentStyle = pageGetSafeEdgeStyle(contentSafeEdges, insets);
    const headerStyle = { ...pageGetSafeEdgeStyle(safeEdges, insets), zIndex: CHROME_PAGE_Z_INDEX };
    const footerStyle = { paddingBottom: bottom, zIndex: CHROME_PAGE_Z_INDEX };
    const hasFooter = isDefined(footer);

    return (
        <>
            <View {...rest} collapsable={collapsable} className={cn('relative flex-1', className)} style={contentStyle}>
                <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>
            </View>

            <EdgeFade position="top" />
            <View className="absolute top-0 right-0 left-0" style={headerStyle}>
                {header}
            </View>

            {hasFooter ? (
                <KeyboardStickyView style={CHROME_PAGE_FOOTER_STICKY_STYLE}>
                    <EdgeFade position="bottom" />
                    <View style={footerStyle}>{footer}</View>
                </KeyboardStickyView>
            ) : null}
        </>
    );
};
