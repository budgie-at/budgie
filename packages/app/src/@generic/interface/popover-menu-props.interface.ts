import type { PopoverMenuAnchor } from '../component/popover-menu/popover-menu';
import type { EmptyFn } from '@rnw-community/shared';
import type { ReactNode } from 'react';

export interface PopoverMenuPropsInterface {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly onCloseComplete?: EmptyFn;
    readonly children: ReactNode;
    readonly anchor?: PopoverMenuAnchor;
    readonly placement?: 'bottom' | 'auto' | 'top';
    readonly align?: 'end' | 'auto' | 'start';
}
