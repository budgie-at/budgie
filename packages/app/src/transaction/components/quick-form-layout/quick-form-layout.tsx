import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { BottomChromeInsetProvider, ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { emptyFn, isDefined } from '@rnw-community/shared';

import { SheetBottomFade } from '../../../@generic/component/sheet-bottom-fade/sheet-bottom-fade';
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
const DEFAULT_TOP_INSET = 44;
const FOOTER_STYLE = { paddingHorizontal: 20 };
const ACTION_PLATE_STYLE = { marginHorizontal: -20, paddingHorizontal: 20 };
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

    return (
        <ScopedVariables variables={rowColors}>
            <TransactionKeypadContext value={keypadContext}>
                <BottomChromeInsetProvider>
                    <QuickFormScroll topInset={topInset}>
                        <View className="pt-[4px] pb-[8px]">{amount}</View>
                        {context}
                        <View className="gap-y-[12px] pt-[8px]" onTouchStart={onDismissKeypad}>
                            {children}
                        </View>
                    </QuickFormScroll>
                    <KeyboardStickyView style={StyleSheet.absoluteFill} pointerEvents="box-none">
                        <ScreenChromeFooter contentStyle={FOOTER_STYLE} includeBottomSafeArea={false}>
                            <View style={ACTION_PLATE_STYLE} className="gap-y-[8px] bg-surface pt-[8px] pb-safe-or-[8px]">
                                <SheetBottomFade className="bottom-auto top-[-28px]" />
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
