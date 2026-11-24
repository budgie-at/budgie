import { useState } from 'react';

import { PopoverMenuContent } from '../popover-menu-content/popover-menu-content';

import type { PopoverMenuPropsInterface } from '../../interface/popover-menu-props.interface';

export interface PopoverMenuAnchor {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

export const PopoverMenu = (props: PopoverMenuPropsInterface) => {
    const [isMounted, setIsMounted] = useState(props.isOpen);

    if (!props.isOpen && !isMounted) {
        return null;
    }

    if (props.isOpen && !isMounted) {
        setIsMounted(true);
    }

    const handleCloseComplete = () => {
        setIsMounted(false);
        props.onCloseComplete?.();
    };

    return <PopoverMenuContent {...props} onCloseComplete={handleCloseComplete} />;
};
