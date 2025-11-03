import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import type { ComponentProps } from 'react';

const Wrapper = styled(SafeAreaView);

export const Page = ({ className, ...rest }: ComponentProps<typeof SafeAreaView>) => (
    <Wrapper {...rest} className={cn('bg-primary-reverse pl-5xl pr-5xl flex-1', className)} />
);
