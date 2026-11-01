import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

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
    readonly confirmTestID?: string;
}

export const TransactionKeypad = (props: Props) => {
    const { keypad, onConfirm, onCancel, isConfirmDisabled = false, confirmTestID } = props;
    const { t } = useLingui();

    return (
        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="flex-1 pb-lg">
            <View className="flex-1 gap-md">
                <View className="flex-1 gap-md">
                    {DIGIT_ROWS.map(row => (
                        <View key={row.join('')} className="flex-1 flex-row gap-md">
                            {row.map(digit => (
                                <KeypadDigitButton key={digit} digit={digit} onDigit={keypad.onDigit} />
                            ))}
                        </View>
                    ))}
                    <View className="flex-1 flex-row gap-md">
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

                <View className="flex-row gap-md">
                    <TransactionKeypadButton icon={UserIconNameEnum.X} variant="cancel" accessibilityLabel={t`Cancel`} onPress={onCancel} />
                    <TransactionKeypadConfirmButton isDisabled={isConfirmDisabled} onPress={onConfirm} testID={confirmTestID} />
                </View>
            </View>
        </Animated.View>
    );
};
