export const TransactionKeypadSelector = {
    Digit: (digit: string) => `TransactionKeypad.Digit.${digit}` as const,
    Decimal: 'TransactionKeypad.Decimal',
    Backspace: 'TransactionKeypad.Backspace'
} as const;
