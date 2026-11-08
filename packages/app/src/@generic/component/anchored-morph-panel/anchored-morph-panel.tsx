import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnchoredMorphPanelContext } from '../../context/anchored-morph-panel.context';
import { useAnchoredMorphPanelMotion } from '../../hook/use-anchored-morph-panel-motion.hook';

import type { WindowRectInterface } from '../../interface/window-rect.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly originRect: WindowRectInterface;
    readonly originRadius?: number;
    readonly onDismissed: () => void;
    readonly children: ReactNode;
}

export const AnchoredMorphPanel = ({ originRect, originRadius = 0, onDismissed, children }: Props) => {
    const { panelStyle, contentStyle, scrimStyle, handleClose } = useAnchoredMorphPanelMotion(originRect, originRadius, onDismissed);

    return (
        <AnchoredMorphPanelContext value={handleClose}>
            <View className="absolute inset-0" collapsable={false}>
                <Pressable className="absolute inset-0" accessible={false} onPress={handleClose}>
                    <Animated.View className="flex-1 bg-black" style={scrimStyle} />
                </Pressable>

                <Animated.View className="bg-sheet-surface absolute overflow-hidden" style={panelStyle}>
                    <Animated.View className="absolute top-0 left-0" style={contentStyle}>
                        {children}
                    </Animated.View>
                </Animated.View>
            </View>
        </AnchoredMorphPanelContext>
    );
};
