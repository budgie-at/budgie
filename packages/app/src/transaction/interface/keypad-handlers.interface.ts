export interface KeypadHandlersInterface {
    readonly onDigit: (digit: string) => void;
    readonly onDecimal: () => void;
    readonly onBackspace: () => void;
    readonly onLongBackspace: () => void;
}
