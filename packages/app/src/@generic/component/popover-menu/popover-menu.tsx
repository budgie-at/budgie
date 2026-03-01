import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { usePopoverAnimation } from './use-popover-animation.hook';

const MENU_MARGIN = 16;
const DEFAULT_MENU_TOP = 64;
const ANCHOR_OFFSET = 8;

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
}

export const PopoverMenu = ({ isOpen, onClose, onCloseComplete, children, anchor }: Props) => {
    const { t } = useLingui();
    const { width: screenWidth } = useWindowDimensions();
    const { isAnimatingOut, backdropStyle, menuStyle } = usePopoverAnimation(isOpen, onCloseComplete);

    const menuTop = anchor ? anchor.y + anchor.height + ANCHOR_OFFSET : DEFAULT_MENU_TOP;
    const menuRight = anchor ? screenWidth - anchor.x - anchor.width : MENU_MARGIN;

    const menuContainerStyle: ViewStyle = { position: 'absolute', top: menuTop, right: menuRight };

    const shouldRender = isOpen || isAnimatingOut;

    if (!shouldRender) {
        return null;
    }

    return (
        <Modal transparent visible={shouldRender} animationType="none" onRequestClose={() => void onClose()}>
            <View className="flex-1" accessibilityViewIsModal>
                <Pressable onPress={() => void onClose()} style={StyleSheet.absoluteFill} accessibilityLabel={t`Close menu`}>
                    <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
                </Pressable>

                <View style={menuContainerStyle} accessibilityRole="menu">
                    <Animated.View
                        className="min-w-[220px] overflow-hidden rounded-2xl border border-secondary-corner bg-primary-reverse shadow-lg"
                        style={menuStyle}
                    >
                        {children}
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};
