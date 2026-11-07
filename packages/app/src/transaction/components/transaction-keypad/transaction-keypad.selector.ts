export const TransactionKeypadSelector = {
    Dismiss: 'TransactionKeypad.Dismiss',
    Digit: (digit: string) => `TransactionKeypad.Digit.${digit}` as const,
    Decimal: 'TransactionKeypad.Decimal',
    Backspace: 'TransactionKeypad.Backspace'
} as const;
