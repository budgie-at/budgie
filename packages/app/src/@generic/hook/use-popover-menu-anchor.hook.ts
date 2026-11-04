import { useRef, useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PopoverMenuAnchor } from '../component/popover-menu/popover-menu';

import { useDeferredMenuClose } from './use-deferred-menu-close.hook';

import type { GestureResponderEvent, View } from 'react-native';

const TRIGGER_SIZE = 40;

export const usePopoverMenuAnchor = (triggerSize = TRIGGER_SIZE) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor>();
    const frameRef = useRef<View>(null);
    const { closeMenu, runPendingAction: handleCloseComplete } = useDeferredMenuClose(isMenuOpen, setIsMenuOpen);

    const handleToggleMenu = (event: GestureResponderEvent) => {
        if (isMenuOpen) {
            closeMenu();

            return;
        }

        const frame = frameRef.current;

        if (isDefined(frame)) {
            frame.measureInWindow((x, y, width, height) => {
                setAnchor({ x, y, width, height });
                setIsMenuOpen(true);
            });

            return;
        }

        const { pageX, pageY } = event.nativeEvent;
        const hasValidAnchor = Number.isFinite(pageX) && Number.isFinite(pageY) && isPositiveNumber(pageX) && isPositiveNumber(pageY);

        if (hasValidAnchor) {
            setAnchor({ x: pageX - triggerSize / 2, y: pageY - triggerSize / 2, width: triggerSize, height: triggerSize });
        } else {
            setAnchor(void 0);
        }

        setIsMenuOpen(true);
    };

    return { anchor, frameRef, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen };
};
