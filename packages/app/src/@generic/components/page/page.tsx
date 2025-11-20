import { styled } from 'nativewind';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import type { ComponentProps, ReactNode } from 'react';
import type { Edges } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof View> {
    readonly safeEdges?: Edges;
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
}

const Wrapper = styled(SafeAreaView);
const DEFAULT_SAFE_EDGES: Edges = ['top'];

export const Page = ({ className, header, footer, children, safeEdges = DEFAULT_SAFE_EDGES, contentClassName, ...rest }: Props) => (
    <Wrapper {...rest} className={cn('bg-primary-reverse flex-1', className)} edges={safeEdges}>
        {header}
        <View className={cn('bg-primary-reverse px-5xl flex-1', contentClassName)}>{children}</View>
        {footer}
    </Wrapper>
);
