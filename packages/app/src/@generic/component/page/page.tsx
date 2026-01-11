import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';
import { BlurGradient } from '../blur-gradient/blur-gradient';

import type { ComponentProps, ReactNode } from 'react';
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

    return (
        <>
            <View {...rest} className={cn('relative flex-1', className)} style={style}>
                {withBlur ? null : header}

                <View className={cn('px-5xl flex-1', contentClassName)}>{children}</View>

                {footer}
            </View>

            {withBlur ? (
                <BlurGradient position="top">
                    <View className="absolute top-0 right-0 left-0" style={style}>
                        {header}
                    </View>
                </BlurGradient>
            ) : null}
        </>
    );
};
