import * as Slot from '@rn-primitives/slot';
import { View } from 'react-native';

import type { PropsWithChildren } from 'react';

interface CardPropsInterface {
    readonly asChild?: boolean;
}

export const Card = ({ asChild, ...rest }: PropsWithChildren<CardPropsInterface>) => {
    const Component = asChild === true ? Slot.View : View;

    return <Component className="p-5xl border rounded-5xl border-corner" {...rest} />;
};
