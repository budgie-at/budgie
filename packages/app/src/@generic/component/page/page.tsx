import { EdgeFade } from '@budgie/screen-chrome';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import type { ComponentProps, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof View> {
    readonly safeEdges?: Edge[];
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
    readonly withBlur?: boolean;
}

const DEFAULT_SAFE_EDGES: Edge[] = ['top'];
const PAGE_HEADER_FADE_HEIGHT = 112;
const PAGE_CHROME_Z_INDEX = 3;

export const Page = (props: Props) => {
    const {
        className,
        header,
        footer,
        children,
        safeEdges = DEFAULT_SAFE_EDGES,
        contentClassName,
        withBlur = false,
        collapsable = false,
        ...rest
    } = props;

    const { top, left, right, bottom } = useSafeAreaInsets();

    const style = {
        ...(safeEdges.includes('top') ? { paddingTop: top } : {}),
        ...(safeEdges.includes('left') ? { paddingLeft: left } : {}),
        ...(safeEdges.includes('right') ? { paddingRight: right } : {}),
        ...(safeEdges.includes('bottom') ? { paddingBottom: bottom } : {})
    };

    const headerStyle = { ...style, zIndex: PAGE_CHROME_Z_INDEX };
    const footerStyle = { paddingBottom: bottom, zIndex: PAGE_CHROME_Z_INDEX };
    const footerStickyStyle = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;
    const headerFadeHeight = top + PAGE_HEADER_FADE_HEIGHT;

    return (
        <>
            <View {...rest} collapsable={collapsable} className={cn('relative flex-1', className)} style={style}>
                {withBlur ? null : header}

                <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>

                {withBlur ? null : footer}
            </View>

            {withBlur ? (
                <>
                    <EdgeFade position="top" height={headerFadeHeight} />
                    <View className="absolute top-0 right-0 left-0" style={headerStyle}>
                        {header}
                    </View>
                </>
            ) : null}

            {withBlur ? (
                <KeyboardStickyView style={footerStickyStyle}>
                    <EdgeFade position="bottom" />
                    <View style={footerStyle}>{footer}</View>
                </KeyboardStickyView>
            ) : null}
        </>
    );
};
