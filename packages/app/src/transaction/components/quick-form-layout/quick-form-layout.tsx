import { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ScopedVariables, useUniwind } from 'uniwind';

import { BottomChromeInsetProvider, ScreenChromeFooter, ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { useQuickFormLayout } from '../../hook/use-quick-form-layout.hook';

interface Props {
    readonly amount: ReactNode;
    readonly context?: ReactNode;
    readonly suggestions?: ReactNode;
    readonly children: ReactNode;
    readonly keypad?: ReactNode;
    readonly actions: ReactNode;
}

const FOOTER_STYLE = { position: 'relative' } as const;
const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const CONTENT_STYLE = { paddingBottom: 16 };
const SCROLL_VIEW_STYLE = { flex: 1 };
const DARK_ROW_COLORS = { '--color-grouped-surface-row': '#151517', '--color-surface-row': '#151517' };
const DEFAULT_ROW_COLORS = {};

export const QuickFormLayout = ({ amount, context, suggestions, children, keypad, actions }: Props) => {
    const { theme } = useUniwind();
    const {
        isScrollingLayout,
        topEdgeStyle,
        bottomEdgeStyle,
        handleLayout,
        handleAmountLayout,
        handleContentSizeChange,
        handleScrollLayout,
        isLoading
    } = useQuickFormLayout(isDefined(keypad));
    const rowColors = theme === 'dark' ? DARK_ROW_COLORS : DEFAULT_ROW_COLORS;
    const header = (
        <View className="pt-[4px] pb-[12px]" onLayout={handleAmountLayout}>
            {amount}
        </View>
    );
    const scrollingKeypad = isScrollingLayout ? keypad : null;
    const pinnedKeypad = isScrollingLayout ? null : keypad;

    return (
        <ScopedVariables variables={rowColors}>
            <BottomChromeInsetProvider>
                <View className="flex-1" onLayout={handleLayout}>
                    <RevealGate isLoading={isLoading}>
                        {isScrollingLayout ? null : header}
                        <View className="relative flex-1">
                            <ScreenChromeScrollView
                                style={SCROLL_VIEW_STYLE}
                                onContentSizeChange={handleContentSizeChange}
                                onLayout={handleScrollLayout}
                                showsVerticalScrollIndicator
                                includeTopSafeArea={false}
                                contentContainerStyle={CONTENT_STYLE}
                                bounces={false}
                                keyboardShouldPersistTaps="handled"
                                contentInsetAdjustmentBehavior="never"
                                automaticallyAdjustContentInsets={false}
                            >
                                {isScrollingLayout ? header : null}
                                <View className="gap-y-[12px]">
                                    {scrollingKeypad}
                                    {context}
                                    {children}
                                </View>
                            </ScreenChromeScrollView>
                            <Animated.View
                                pointerEvents="none"
                                style={topEdgeStyle}
                                className="absolute top-0 -left-[20px] -right-[20px] h-hairline bg-surface-separator"
                            />
                            <Animated.View
                                pointerEvents="none"
                                style={bottomEdgeStyle}
                                className="absolute bottom-0 -left-[20px] -right-[20px] h-hairline bg-surface-separator"
                            />
                        </View>
                        <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS} style={FOOTER_STYLE}>
                            <View className="gap-y-[8px] pt-[12px] pb-[8px]">
                                {suggestions}
                                {pinnedKeypad}
                                <View className="pt-[8px]">{actions}</View>
                            </View>
                        </ScreenChromeFooter>
                    </RevealGate>
                </View>
            </BottomChromeInsetProvider>
        </ScopedVariables>
    );
};
