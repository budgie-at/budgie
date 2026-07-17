import type { ComponentProps, ReactNode } from 'react';
import type { View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

export interface PageChromePropsInterface extends ComponentProps<typeof View> {
    readonly safeEdges?: Edge[];
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
    readonly contentClassName?: string;
}
