import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

import type { ComponentProps } from 'react';

export const Page = ({ className, ...rest }: ComponentProps<typeof View>) => (
    <View {...rest} className={cn('bg-primary-reverse pl-5xl pr-5xl flex-1', className)} />
);
