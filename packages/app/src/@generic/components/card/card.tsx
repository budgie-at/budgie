import * as Slot from '@rn-primitives/slot';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

import type { PropsWithChildren } from 'react';

interface CardPropsInterface {
    readonly asChild?: boolean;
    readonly className?: string;
}

export const Card = ({ asChild, className, ...rest }: PropsWithChildren<CardPropsInterface>) => {
    const Component = asChild === true ? Slot.View : View;

    return <Component className={cn(`p-5xl border rounded-5xl border-corner`, className)} {...rest} />;
};
