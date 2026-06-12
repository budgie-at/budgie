import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';
import { BlurGradient } from '../blur-gradient/blur-gradient';

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

export const Page = (props: Props) => {
    const { className, header, footer, children, safeEdges = DEFAULT_SAFE_EDGES, contentClassName, withBlur = false, ...rest } = props;

    const { top, left, right, bottom } = useSafeAreaInsets();

    const style = {
        ...(safeEdges.includes('top') ? { paddingTop: top } : {}),
        ...(safeEdges.includes('left') ? { paddingLeft: left } : {}),
        ...(safeEdges.includes('right') ? { paddingRight: right } : {}),
        ...(safeEdges.includes('bottom') ? { paddingBottom: bottom } : {})
    };

    const bottomStyle = { paddingBottom: bottom };
    const footerStickyStyle = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;

    return (
        <>
            <View {...rest} className={cn('relative flex-1', className)} style={style}>
                {withBlur ? null : header}

                <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>

                {withBlur ? null : footer}
            </View>

            {withBlur ? (
                <BlurGradient position="top" edgeOffset={top}>
                    <View className="absolute top-0 right-0 left-0" style={style}>
                        {header}
                    </View>
                </BlurGradient>
            ) : null}

            {withBlur ? (
                <KeyboardStickyView style={footerStickyStyle}>
                    <BlurGradient position="bottom" edgeOffset={bottom}>
                        <View style={bottomStyle}>{footer}</View>
                    </BlurGradient>
                </KeyboardStickyView>
            ) : null}
        </>
    );
};
