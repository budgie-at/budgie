import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';
import { TransactionKeypadSelector } from '../transaction-keypad/transaction-keypad.selector';

interface Props {
    readonly digit: string;
    readonly onDigit: (digit: string) => void;
}

export const KeypadDigitButton = ({ digit, onDigit }: Props) => {
    const handlePress = () => {
        onDigit(digit);
    };

    return <TransactionKeypadButton value={digit} onPress={handlePress} testID={TransactionKeypadSelector.Digit(digit)} />;
};
