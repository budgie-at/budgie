import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { BottomChromeInsetProvider, ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { emptyFn, isDefined } from '@rnw-community/shared';

import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { QuickFormScroll } from '../quick-form-scroll/quick-form-scroll';

interface Props {
    readonly amount: ReactNode;
    readonly surfaceVariables?: ComponentProps<typeof ScopedVariables>['variables'];
    readonly context?: ReactNode;
    readonly children: ReactNode;
    readonly keypad?: ReactNode;
    readonly actions: ReactNode;
    readonly onDismissKeypad?: () => void;
    readonly topInset?: number;
}

const ENTERING = FadeInDown.springify().duration(300).dampingRatio(1).reduceMotion(ReduceMotion.System);
const EXIT_DURATION = 140;
const CONTEXT_HEIGHT = 108;
const DEFAULT_TOP_INSET = 44;
const COMPACT_FORM_HEIGHT = 766;
const FOOTER_STYLE = { paddingHorizontal: 20 };
const EXITING = FadeOutDown.springify().duration(EXIT_DURATION).dampingRatio(1).reduceMotion(ReduceMotion.System);

export const QuickFormLayout = (props: Props) => {
    const { amount, context, children, keypad, actions, surfaceVariables, onDismissKeypad = emptyFn, topInset = DEFAULT_TOP_INSET } = props;
    const rowColor = useCSSVariable('--color-transaction-form-row');
    const isExpanded = isDefined(keypad);
    const rowColors = {
        ...(isDefined(rowColor) && { '--color-grouped-surface-row': rowColor, '--color-surface-row': rowColor }),
        ...surfaceVariables
    };
    const keypadContext = { isExpanded, dismiss: onDismissKeypad };
    const { height } = useWindowDimensions();
    const contextHeight = isExpanded ? Math.min(CONTEXT_HEIGHT, Math.max(0, height - COMPACT_FORM_HEIGHT)) : CONTEXT_HEIGHT;
    const contextStyle = { height: contextHeight };

    return (
        <ScopedVariables variables={rowColors}>
            <TransactionKeypadContext value={keypadContext}>
                <BottomChromeInsetProvider>
                    <QuickFormScroll topInset={topInset}>
                        <View className="pt-[4px] pb-[8px]">{amount}</View>
                        <View style={contextStyle} className="overflow-hidden justify-center">
                            {context}
                        </View>
                        <View className="gap-y-[12px] pt-[8px]" onTouchStart={onDismissKeypad}>
                            {children}
                        </View>
                    </QuickFormScroll>
                    <KeyboardStickyView style={StyleSheet.absoluteFill} pointerEvents="box-none">
                        <ScreenChromeFooter contentStyle={FOOTER_STYLE}>
                            <View className="gap-y-[8px] pt-[8px] pb-[8px]">
                                {isExpanded ? (
                                    <Animated.View entering={ENTERING} exiting={EXITING}>
                                        {keypad}
                                    </Animated.View>
                                ) : null}
                                {actions}
                            </View>
                        </ScreenChromeFooter>
                    </KeyboardStickyView>
                </BottomChromeInsetProvider>
            </TransactionKeypadContext>
        </ScopedVariables>
    );
};
