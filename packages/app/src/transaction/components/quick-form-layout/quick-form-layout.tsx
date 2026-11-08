import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { BottomChromeInsetProvider, ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { emptyFn, isDefined } from '@rnw-community/shared';

import { SheetBottomFade } from '../../../@generic/component/sheet-bottom-fade/sheet-bottom-fade';
import { EASE_OUT, MOTION_FAST_DURATION } from '../../../@generic/constant/motion.constant';
import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { isCompactTransactionForm } from '../../utils/is-compact-transaction-form.util';
import { QuickFormScroll } from '../quick-form-scroll/quick-form-scroll';

interface Props {
    readonly amount: ReactNode;
    readonly surfaceVariables?: ComponentProps<typeof ScopedVariables>['variables'];
    readonly context?: ReactNode;
    readonly suggestions?: ReactNode;
    readonly children?: ReactNode;
    readonly keypad?: ReactNode;
    readonly actions: ReactNode;
    readonly onDismissKeypad?: () => void;
}

const ENTERING_DURATION = 180;
const ENTERING = FadeInDown.duration(ENTERING_DURATION).easing(EASE_OUT);
const FOOTER_STYLE = { paddingHorizontal: 20 };
const ACTION_PLATE_STYLE = { marginHorizontal: -20, paddingHorizontal: 20 };
const EXITING = FadeOut.duration(MOTION_FAST_DURATION).easing(EASE_OUT);

export const QuickFormLayout = (props: Props) => {
    const { amount, context, suggestions, children, keypad, actions, surfaceVariables, onDismissKeypad = emptyFn } = props;
    const rowColor = useCSSVariable('--color-transaction-form-row');
    const { fontScale, height } = useWindowDimensions();
    const isCompact = isCompactTransactionForm(fontScale, height);
    const amountClassName = isCompact ? 'pt-[4px] pb-[4px]' : 'pt-[4px] pb-[8px]';
    const fieldsClassName = isCompact ? 'gap-y-[8px] pt-[4px]' : 'gap-y-[12px] pt-[8px]';
    const fadeClassName = isCompact ? 'bottom-auto top-[-16px] h-[16px]' : 'bottom-auto top-[-28px]';
    const isExpanded = isDefined(keypad);
    const actionPlateStyle = { ...ACTION_PLATE_STYLE, rowGap: isCompact ? 6 : 8 };
    const rowColors = {
        ...(isDefined(rowColor) && { '--color-grouped-surface-row': rowColor, '--color-surface-row': rowColor }),
        ...surfaceVariables
    };
    const keypadContext = { dismiss: onDismissKeypad, isExpanded };

    return (
        <ScopedVariables variables={rowColors}>
            <TransactionKeypadContext value={keypadContext}>
                <BottomChromeInsetProvider>
                    <QuickFormScroll topInset={44}>
                        <View className={amountClassName}>{amount}</View>
                        {context}
                        <View className={fieldsClassName} onTouchStart={onDismissKeypad}>
                            {children}
                        </View>
                    </QuickFormScroll>
                    <KeyboardStickyView style={StyleSheet.absoluteFill} pointerEvents="box-none">
                        <ScreenChromeFooter contentStyle={FOOTER_STYLE} includeBottomSafeArea={false}>
                            <View style={actionPlateStyle} className="bg-surface pt-[8px] pb-safe-or-[8px]">
                                <SheetBottomFade className={fadeClassName} />
                                {suggestions}
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
