import { useLingui } from '@lingui/react/macro';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { usePopoverAnimation } from './use-popover-animation.hook';

const MENU_MARGIN = 16;
const DEFAULT_MENU_TOP = 64;
const ANCHOR_OFFSET = 8;

export type PopoverMenuPlacement = 'bottom' | 'auto';

export interface PopoverMenuAnchor {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

interface Props {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly onCloseComplete?: EmptyFn;
    readonly children: ReactNode;
    readonly anchor?: PopoverMenuAnchor;
    readonly placement?: PopoverMenuPlacement;
}

// eslint-disable-next-line max-statements -- Popover positioning derives many local values from layout, animation, and safe-area inputs
export const PopoverMenu = ({ isOpen, onClose, onCloseComplete, children, anchor, placement = 'auto' }: Props) => {
    const { t } = useLingui();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { bottom: safeBottom } = useSafeAreaInsets();
    const { isAnimatingOut, backdropStyle, menuStyle } = usePopoverAnimation(isOpen, onCloseComplete);
    const [menuHeight, setMenuHeight] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => {
        setMenuHeight(event.nativeEvent.layout.height);
    };

    const hasAnchor = isDefined(anchor);
    const spaceBelow = hasAnchor ? screenHeight - safeBottom - (anchor.y + anchor.height) - ANCHOR_OFFSET : 0;
    const shouldFlipAbove = hasAnchor && placement === 'auto' && menuHeight > 0 && menuHeight > spaceBelow;

    let menuTop = DEFAULT_MENU_TOP;
    if (hasAnchor && shouldFlipAbove) {
        menuTop = anchor.y - menuHeight - ANCHOR_OFFSET;
    } else if (hasAnchor) {
        menuTop = anchor.y + anchor.height + ANCHOR_OFFSET;
    }

    const menuRight = hasAnchor ? screenWidth - anchor.x - anchor.width : MENU_MARGIN;
    const isMeasuring = hasAnchor && placement === 'auto' && menuHeight === 0;
    const measuringStyle: ViewStyle | null = isMeasuring ? { opacity: 0 } : null;

    const menuContainerStyle: ViewStyle = { position: 'absolute', top: menuTop, right: menuRight };
    const animatedMenuStyle = [menuStyle, measuringStyle];

    const shouldRender = isOpen || isAnimatingOut;

    const handleClose = () => void onClose();

    if (!shouldRender) {
        return null;
    }

    return (
        <Modal transparent visible={shouldRender} animationType="none" onRequestClose={handleClose}>
            <View className="flex-1" accessibilityViewIsModal>
                <Pressable onPress={handleClose} style={StyleSheet.absoluteFill} accessibilityLabel={t`Close menu`}>
                    <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
                </Pressable>

                <View style={menuContainerStyle} accessibilityRole="menu">
                    <Animated.View
                        className="min-w-[220px] overflow-hidden rounded-2xl border border-secondary-corner bg-primary-reverse shadow-lg"
                        style={animatedMenuStyle}
                        onLayout={handleLayout}
                    >
                        {children}
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};
