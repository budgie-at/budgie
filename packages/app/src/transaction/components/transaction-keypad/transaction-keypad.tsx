import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { getTransactionKeypadLayout } from '../../utils/get-transaction-keypad-layout.util';
import { KeypadDigitButton } from '../keypad-digit-button/keypad-digit-button';
import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';

import { TransactionKeypadSelector } from './transaction-keypad.selector';

import type { KeypadHandlersInterface } from '../../interface/keypad-handlers.interface';

const DIGIT_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
] as const;

interface Props {
    readonly keypad: KeypadHandlersInterface;
}

export const TransactionKeypad = (props: Props) => {
    const { keypad } = props;
    const { dismiss } = use(TransactionKeypadContext);
    const { t } = useLingui();
    const { fontScale, height } = useWindowDimensions();
    const { decimalSeparator } = useLocaleInfo();
    const { rowStyle, digitsStyle } = getTransactionKeypadLayout(fontScale, height);

    return (
        <View className="flex-1" style={digitsStyle}>
            {DIGIT_ROWS.map(row => (
                <View key={row.join('')} className="flex-1 flex-row gap-md" style={rowStyle}>
                    {row.map(digit => (
                        <KeypadDigitButton key={digit} digit={digit} onDigit={keypad.onDigit} />
                    ))}
                </View>
            ))}
            <View className="flex-1 flex-row gap-md" style={rowStyle}>
                <TransactionKeypadButton value={decimalSeparator} onPress={keypad.onDecimal} testID={TransactionKeypadSelector.Decimal} />
                <KeypadDigitButton digit="0" onDigit={keypad.onDigit} />
                <TransactionKeypadButton
                    icon={UserIconNameEnum.ChevronDown}
                    accessibilityLabel={t`Hide keypad`}
                    onPress={dismiss}
                    testID={TransactionKeypadSelector.Dismiss}
                />
                <TransactionKeypadButton
                    icon={UserIconNameEnum.Delete}
                    variant="action"
                    accessibilityLabel={t`Delete`}
                    onPress={keypad.onBackspace}
                    onLongPress={keypad.onLongBackspace}
                    testID={TransactionKeypadSelector.Backspace}
                />
            </View>
        </View>
    );
};
