import type { CornerRadiiInterface } from './corner-radii.interface';
import type { WindowRectInterface } from './window-rect.interface';
import type { ReactNode } from 'react';

export interface AnchoredMorphOriginInterface {
    readonly rect: WindowRectInterface;
    readonly radii: CornerRadiiInterface;
    readonly color: string;
    readonly content: ReactNode;
}
