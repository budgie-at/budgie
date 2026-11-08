import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly onLayout: (event: LayoutChangeEvent) => void;
}

const STICKY_FOOTER_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;
const MINIMUM_BOTTOM_PADDING = 16;
const KEYBOARD_GAP = 12;

export const EntityFormFooter = ({ children, onLayout }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const bottomPadding = Math.max(bottom, MINIMUM_BOTTOM_PADDING);
    const keyboardOffset = { closed: 0, opened: bottomPadding - KEYBOARD_GAP };
    const paddingStyle = { paddingBottom: bottomPadding };

    return (
        <KeyboardStickyView style={STICKY_FOOTER_STYLE} offset={keyboardOffset}>
            <View className="bg-sheet-surface px-[16px] pt-md" style={paddingStyle} onLayout={onLayout}>
                <View
                    pointerEvents="none"
                    className="absolute inset-x-0 bottom-full h-[32px] bg-linear-to-t from-sheet-surface to-sheet-surface/0"
                />
                {children}
            </View>
        </KeyboardStickyView>
    );
};
