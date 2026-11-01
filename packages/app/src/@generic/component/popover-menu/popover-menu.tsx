import { useLingui } from '@lingui/react/macro';
import { useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { usePopoverAnimation } from './use-popover-animation.hook';

const MENU_MARGIN = 16;
const DEFAULT_MENU_TOP = 64;
const ANCHOR_OFFSET = 8;
const MENU_MIN_WIDTH = 220;

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
    readonly placement?: 'bottom' | 'auto' | 'top';
    readonly align?: 'end' | 'auto' | 'start';
}

// eslint-disable-next-line max-statements -- Popover positioning derives many local values from layout, animation, and safe-area inputs
export const PopoverMenu = ({ isOpen, onClose, onCloseComplete, children, anchor, placement = 'auto', align = 'end' }: Props) => {
    const { t } = useLingui();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
    const { isRendered, isVisible, handleDismiss, backdropStyle, menuStyle } = usePopoverAnimation(isOpen, onCloseComplete);
    const [menuHeight, setMenuHeight] = useState(0);
    const [menuWidth, setMenuWidth] = useState(MENU_MIN_WIDTH);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useFocusEffect(
        useCallback(
            () => () => {
                onCloseRef.current();
            },
            []
        )
    );

    const handleLayout = (event: LayoutChangeEvent) => {
        setMenuHeight(event.nativeEvent.layout.height);
        setMenuWidth(event.nativeEvent.layout.width);
    };

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
    const isMeasuring = hasAnchor && placement !== 'bottom' && menuHeight === 0;
    const measuringStyle: ViewStyle | null = isMeasuring ? { opacity: 0 } : null;

    const menuMaxWidth = screenWidth - MENU_MARGIN * 2;
    const menuContainerStyle: ViewStyle = isStartAligned
        ? {
              position: 'absolute',
              top: menuTop,
              left: Math.min(Math.max(anchor.x, MENU_MARGIN), screenWidth - MENU_MARGIN - menuWidth),
              maxWidth: menuMaxWidth
          }
        : { position: 'absolute', top: menuTop, right: menuRight, maxWidth: menuMaxWidth };
    const animatedMenuStyle = [menuStyle, measuringStyle];
    const measuringPointerEvents = isMeasuring ? 'none' : 'auto';
    const measuringImportantForAccessibility = isMeasuring ? 'no-hide-descendants' : 'auto';

    const handleClose = () => void onClose();

    if (!isRendered) {
        return null;
    }

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleClose} onDismiss={handleDismiss}>
            <View className="flex-1" accessibilityViewIsModal>
                <Pressable onPress={handleClose} style={StyleSheet.absoluteFill} accessibilityLabel={t`Close menu`}>
                    <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
                </Pressable>

                <View style={menuContainerStyle} accessibilityRole="menu">
                    <Animated.View
                        className="min-w-[220px] overflow-hidden rounded-2xl border-hairline border-popover-border bg-popover-surface shadow-lg"
                        style={animatedMenuStyle}
                        onLayout={handleLayout}
                        pointerEvents={measuringPointerEvents}
                        accessibilityElementsHidden={isMeasuring}
                        importantForAccessibility={measuringImportantForAccessibility}
                    >
                        {children}
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};
