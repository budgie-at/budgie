import { styled } from 'nativewind';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import type { ComponentProps } from 'react';

const Wrapper = styled(SafeAreaView);
const DEFAULT_EDGES: Edges = ['top'];

export const Page = ({ className, edges = DEFAULT_EDGES, ...rest }: ComponentProps<typeof SafeAreaView>) => (
    <Wrapper {...rest} edges={edges} className={cn('bg-primary-reverse pl-5xl pr-5xl flex-1', className)} />
);
