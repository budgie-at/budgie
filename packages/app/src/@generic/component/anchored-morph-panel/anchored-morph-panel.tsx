import { useLingui } from '@lingui/react/macro';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { MorphingSheetDismissContext } from '../../context/morphing-sheet.context';
import { SurfaceSettledContext } from '../../context/surface-settled.context';
import { AnchoredMorphPanelHeightEnum } from '../../enum/anchored-morph-panel-height.enum';
import { useAnchoredMorphPanelMotion } from '../../hook/use-anchored-morph-panel-motion.hook';

import type { AnchoredMorphOriginInterface } from '../../interface/anchored-morph-origin.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly origin: AnchoredMorphOriginInterface;
    readonly onDismissed: () => void;
    readonly height?: AnchoredMorphPanelHeightEnum;
    readonly children: ReactNode;
}

export const AnchoredMorphPanel = ({ origin, onDismissed, height = AnchoredMorphPanelHeightEnum.FILL, children }: Props) => {
    const { t } = useLingui();
    const fitsContent = height === AnchoredMorphPanelHeightEnum.CONTENT;
    const { panelStyle, ghostStyle, contentStyle, scrimStyle, handleClose, handleContentLayout, isSettled } = useAnchoredMorphPanelMotion(
        origin,
        fitsContent,
        onDismissed
    );
    const contentLayoutHandler = fitsContent ? handleContentLayout : void 0;

    return (
        <View className="absolute inset-0" collapsable={false} accessibilityViewIsModal onAccessibilityEscape={handleClose}>
            <Pressable className="absolute inset-0" accessibilityRole="button" accessibilityLabel={t`Close`} onPress={handleClose}>
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

                <Animated.View className="absolute top-0 left-0" style={contentStyle} onLayout={contentLayoutHandler}>
                    <SurfaceSettledContext value={isSettled}>
                        <MorphingSheetDismissContext value={handleClose}>{children}</MorphingSheetDismissContext>
                    </SurfaceSettledContext>
                </Animated.View>
            </Animated.View>
        </View>
    );
};
