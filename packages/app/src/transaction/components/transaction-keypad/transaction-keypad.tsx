import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWindowDimensions, View } from 'react-native';
import Animated, { ReduceMotion, FadeInUp } from 'react-native-reanimated';

import { getTransactionKeypadLayout } from '../../utils/get-transaction-keypad-layout.util';
import { KeypadDigitButton } from '../keypad-digit-button/keypad-digit-button';
import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';
import { TransactionKeypadConfirmButton } from '../transaction-keypad-confirm-button/transaction-keypad-confirm-button';

import { TransactionKeypadSelector } from './transaction-keypad.selector';

import type { KeypadHandlersInterface } from '../../interface/keypad-handlers.interface';

const DIGIT_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
] as const;

interface Props {
    readonly keypad: KeypadHandlersInterface;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly isConfirmDisabled?: boolean;
    readonly confirmLabel?: string;
    readonly confirmTestID?: string;
}

export const TransactionKeypad = (props: Props) => {
    const { keypad, onConfirm, onCancel, isConfirmDisabled = false, confirmLabel, confirmTestID } = props;
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const { rowStyle, confirmRowStyle, digitsStyle, keypadStyle } = getTransactionKeypadLayout(fontScale);

    const resolvedConfirmLabel = confirmLabel ?? t`Save`;

    return (
        <Animated.View
            entering={FadeInUp.delay(100).duration(250).reduceMotion(ReduceMotion.System)}
            className="flex-1 pb-md"
            style={keypadStyle}
        >
            <View className="flex-1 gap-md">
                <View className="flex-1 gap-md" style={digitsStyle}>
                    {DIGIT_ROWS.map(row => (
                        <View key={row.join('')} className="flex-1 flex-row gap-md" style={rowStyle}>
                            {row.map(digit => (
                                <KeypadDigitButton key={digit} digit={digit} onDigit={keypad.onDigit} />
                            ))}
                        </View>
                    ))}
                    <View className="flex-1 flex-row gap-md" style={rowStyle}>
                        <TransactionKeypadButton value="." onPress={keypad.onDecimal} />
                        <KeypadDigitButton digit="0" onDigit={keypad.onDigit} />
                        <TransactionKeypadButton
                            icon={UserIconNameEnum.Delete}
                            variant="action"
                            onPress={keypad.onBackspace}
                            onLongPress={keypad.onLongBackspace}
                            testID={TransactionKeypadSelector.Backspace}
                        />
                    </View>
                </View>

                <View className="flex-1 flex-row gap-md" style={confirmRowStyle}>
                    <TransactionKeypadButton icon={UserIconNameEnum.X} variant="cancel" accessibilityLabel={t`Cancel`} onPress={onCancel} />
                    <TransactionKeypadConfirmButton
                        label={resolvedConfirmLabel}
                        isDisabled={isConfirmDisabled}
                        onPress={onConfirm}
                        testID={confirmTestID}
                    />
                </View>
            </View>
        </Animated.View>
    );
};
