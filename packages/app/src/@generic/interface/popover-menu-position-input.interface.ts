import type { PopoverMenuAnchor } from '../component/popover-menu/popover-menu';

export interface PopoverMenuPositionInputInterface {
    readonly anchor: PopoverMenuAnchor | undefined;
    readonly placement: 'bottom' | 'auto' | 'top';
    readonly align: 'end' | 'auto' | 'start';
    readonly menuWidth: number;
    readonly menuHeight: number;
    readonly screenWidth: number;
    readonly screenHeight: number;
    readonly safeTop: number;
    readonly safeBottom: number;
}
