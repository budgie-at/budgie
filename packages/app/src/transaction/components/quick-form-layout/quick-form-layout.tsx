import { ReactNode, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ScopedVariables, useUniwind } from 'uniwind';

import {
    BottomChromeInsetProvider,
    ScreenChromeFooter,
    ScreenChromeScrollView,
    useScrollFadeStyle
} from '@rnw-community/react-native-screen-chrome';

import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { useQuickFormLayout } from '../../hook/use-quick-form-layout.hook';

interface Props {
    readonly amount: ReactNode;
    readonly context?: ReactNode;
    readonly suggestions?: ReactNode;
    readonly children?: ReactNode;
    readonly footer: ReactNode;
    readonly footerHeight?: number;
}

const FOOTER_STYLE = { position: 'relative' } as const;
const CONTENT_STYLE = { paddingBottom: 16 };
const SCROLL_VIEW_STYLE = { flex: 1 };
const DARK_ROW_COLORS = { '--color-grouped-surface-row': '#151517', '--color-surface-row': '#151517' };
const DEFAULT_ROW_COLORS = {};

export const QuickFormLayout = ({ amount, context, suggestions, children, footer, footerHeight }: Props) => {
    const { theme } = useUniwind();
    const scrollRef = useRef<ScrollView>(null);
    const { requiresScrolling, handleLayout, handleAmountLayout, isLoading, keypadContainerStyle } = useQuickFormLayout(footerHeight);
    const handleContentSizeChange = () => {
        if (requiresScrolling) {
            scrollRef.current?.scrollToEnd({ animated: false });
        }
    };
    const rowColors = theme === 'dark' ? DARK_ROW_COLORS : DEFAULT_ROW_COLORS;
    const topFadeStyle = useScrollFadeStyle([0, 16], [0, 1]);
    const footerContent = (
        <View className="pt-[16px] pb-[8px]">
            <ScreenChromeFooter includeBottomSafeArea={false} style={FOOTER_STYLE}>
                <View style={keypadContainerStyle}>{footer}</View>
            </ScreenChromeFooter>
        </View>
    );

    return (
        <ScopedVariables variables={rowColors}>
            <BottomChromeInsetProvider>
                <View className="flex-1" onLayout={handleLayout}>
                    <RevealGate isLoading={isLoading}>
                        <View className="pt-[4px] pb-[8px]" onLayout={handleAmountLayout}>
                            {amount}
                            {suggestions}
                        </View>
                        <View className="relative flex-1">
                            <ScreenChromeScrollView
                                ref={scrollRef}
                                onContentSizeChange={handleContentSizeChange}
                                style={SCROLL_VIEW_STYLE}
                                showsVerticalScrollIndicator
                                includeTopSafeArea={false}
                                contentContainerStyle={CONTENT_STYLE}
                                bounces={false}
                                keyboardShouldPersistTaps="handled"
                                contentInsetAdjustmentBehavior="never"
                                automaticallyAdjustContentInsets={false}
                            >
                                <View className="gap-y-[12px]">
                                    {context}
                                    {children}
                                    {requiresScrolling ? footerContent : null}
                                </View>
                            </ScreenChromeScrollView>
                            <Animated.View pointerEvents="none" style={topFadeStyle} className="absolute top-0 left-0 right-0 h-[32px]">
                                <View className="h-[16px] bg-grouped-surface" />
                                <View className="h-[16px] bg-linear-to-b from-grouped-surface to-grouped-surface/0" />
                            </Animated.View>
                            <View
                                pointerEvents="none"
                                className="absolute bottom-0 left-0 right-0 h-[8px] bg-linear-to-t from-grouped-surface to-grouped-surface/0"
                            />
                        </View>
                        {requiresScrolling ? null : footerContent}
                    </RevealGate>
                </View>
            </BottomChromeInsetProvider>
        </ScopedVariables>
    );
};
