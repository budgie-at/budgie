import { useLingui } from '@lingui/react/macro';
import { useFocusEffect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPopoverMenuPosition } from '../../utils/get-popover-menu-position.util';
import { usePopoverAnimation } from '../popover-menu/use-popover-animation.hook';

import type { PopoverMenuPropsInterface } from '../../interface/popover-menu-props.interface';

const MENU_MIN_WIDTH = 220;

export const PopoverMenuContent = ({
    isOpen,
    onClose,
    onCloseComplete,
    children,
    anchor,
    placement = 'auto',
    align = 'end'
}: PopoverMenuPropsInterface) => {
    const { t } = useLingui();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
    const { isRendered, isVisible, handleDismiss, backdropStyle, menuStyle } = usePopoverAnimation(isOpen, onCloseComplete);
    const [menuSize, setMenuSize] = useState({ width: MENU_MIN_WIDTH, height: 0 });
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useFocusEffect(() => () => {
        onCloseRef.current();
    });

    const handleLayout = (event: LayoutChangeEvent) =>
        void setMenuSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });

    if (!isRendered) {
        return null;
    }

    const {
        menuContainerStyle,
        menuTransformOrigin,
        isMeasuring,
        measuringStyle,
        measuringPointerEvents,
        measuringImportantForAccessibility
    } = getPopoverMenuPosition({
        anchor,
        placement,
        align,
        menuWidth: menuSize.width,
        menuHeight: menuSize.height,
        screenWidth,
        screenHeight,
        safeTop,
        safeBottom
    });
    const animatedMenuStyle = [menuStyle, { transformOrigin: menuTransformOrigin }, measuringStyle];

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose} onDismiss={handleDismiss}>
            <View className="flex-1" accessibilityViewIsModal>
                <Pressable onPress={onClose} style={StyleSheet.absoluteFill} accessibilityLabel={t`Close menu`}>
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
