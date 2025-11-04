import { Pressable, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';

import type { OnEventFn } from '@rnw-community/shared';
import type { PropsWithChildren } from 'react';

interface Props {
    readonly onPress?: OnEventFn;
    readonly className?: string;
}

export const Card = ({ className, onPress, ...rest }: PropsWithChildren<Props>) => {
    const Component = isDefined(onPress) ? Pressable : View;

    return <Component className={cn(`p-5xl border rounded-5xl border-corner`, className)} onPress={onPress} {...rest} />;
};
