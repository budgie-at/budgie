import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnchoredMorphPanelSettledContext } from '../../context/anchored-morph-panel-settled.context';
import { AnchoredMorphPanelContext } from '../../context/anchored-morph-panel.context';
import { MorphingSheetDismissContext } from '../../context/morphing-sheet.context';
import { useAnchoredMorphPanelMotion } from '../../hook/use-anchored-morph-panel-motion.hook';

import type { AnchoredMorphOriginInterface } from '../../interface/anchored-morph-origin.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly origin: AnchoredMorphOriginInterface;
    readonly onDismissed: () => void;
    readonly children: ReactNode;
}

export const AnchoredMorphPanel = ({ origin, onDismissed, children }: Props) => {
    const { panelStyle, ghostStyle, contentStyle, scrimStyle, handleClose, isSettled } = useAnchoredMorphPanelMotion(origin, onDismissed);

    return (
        <AnchoredMorphPanelContext value={handleClose}>
            <View className="absolute inset-0" collapsable={false}>
                <Pressable className="absolute inset-0" accessible={false} onPress={handleClose}>
                    <Animated.View className="flex-1 bg-black" style={scrimStyle} />
                </Pressable>

                <Animated.View className="absolute overflow-hidden" style={panelStyle}>
                    <Animated.View
                        className="absolute top-0 left-0"
                        style={ghostStyle}
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        {origin.content}
                    </Animated.View>

                    <Animated.View className="absolute top-0 left-0" style={contentStyle}>
                        <AnchoredMorphPanelSettledContext value={isSettled}>
                            <MorphingSheetDismissContext value={handleClose}>{children}</MorphingSheetDismissContext>
                        </AnchoredMorphPanelSettledContext>
                    </Animated.View>
                </Animated.View>
            </View>
        </AnchoredMorphPanelContext>
    );
};
