export const TransactionKeypadSelector = {
    Digit: (digit: string) => `TransactionKeypad.Digit.${digit}` as const,
    Backspace: 'TransactionKeypad.Backspace'
} as const;
