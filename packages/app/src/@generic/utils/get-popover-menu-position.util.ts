import { isDefined } from '@rnw-community/shared';

import type { PopoverMenuPositionInputInterface } from '../interface/popover-menu-position-input.interface';
import type { PopoverMenuPositionInterface } from '../interface/popover-menu-position.interface';
import type { ViewStyle } from 'react-native';

const MENU_MARGIN = 16;
const DEFAULT_MENU_TOP = 64;
const ANCHOR_OFFSET = 8;

export const getPopoverMenuPosition = ({
    anchor,
    placement,
    align,
    menuWidth,
    menuHeight,
    screenWidth,
    screenHeight,
    safeTop,
    safeBottom
}: PopoverMenuPositionInputInterface): PopoverMenuPositionInterface => {
    const hasAnchor = isDefined(anchor);
    const spaceBelow = hasAnchor ? screenHeight - safeBottom - (anchor.y + anchor.height) - ANCHOR_OFFSET : 0;
    const fitsAbove = hasAnchor && anchor.y - menuHeight - ANCHOR_OFFSET >= safeTop;
    const prefersAbove = placement === 'top' ? fitsAbove : menuHeight > spaceBelow;
    const shouldFlipAbove = hasAnchor && placement !== 'bottom' && menuHeight > 0 && prefersAbove;

    let menuTop = DEFAULT_MENU_TOP;
    if (hasAnchor && shouldFlipAbove) {
        menuTop = anchor.y - menuHeight - ANCHOR_OFFSET;
    } else if (hasAnchor) {
        menuTop = anchor.y + anchor.height + ANCHOR_OFFSET;
    }

    const menuRight = hasAnchor
        ? Math.min(Math.max(screenWidth - anchor.x - anchor.width, MENU_MARGIN), screenWidth - MENU_MARGIN - menuWidth)
        : MENU_MARGIN;
    const isStartAligned = hasAnchor && (align === 'start' || (align === 'auto' && anchor.x + anchor.width / 2 < screenWidth / 2));
    const menuMaxWidth = screenWidth - MENU_MARGIN * 2;
    const menuContainerStyle: ViewStyle = isStartAligned
        ? {
              position: 'absolute',
              top: menuTop,
              left: Math.min(Math.max(anchor.x, MENU_MARGIN), screenWidth - MENU_MARGIN - menuWidth),
              maxWidth: menuMaxWidth
          }
        : { position: 'absolute', top: menuTop, right: menuRight, maxWidth: menuMaxWidth };
    const isMeasuring = hasAnchor && placement !== 'bottom' && menuHeight === 0;

    return {
        menuContainerStyle,
        menuTransformOrigin: `${isStartAligned ? 'left' : 'right'} ${shouldFlipAbove ? 'bottom' : 'top'}`,
        isMeasuring,
        measuringStyle: isMeasuring ? { opacity: 0 } : null,
        measuringPointerEvents: isMeasuring ? 'none' : 'auto',
        measuringImportantForAccessibility: isMeasuring ? 'no-hide-descendants' : 'auto'
    };
};
