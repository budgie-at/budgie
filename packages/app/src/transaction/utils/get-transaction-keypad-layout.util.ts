const MAX_KEY_HEIGHT = 72;

export const getTransactionKeypadLayout = (fontScale: number) => {
    const rowStyle = { minHeight: Math.max(48, 32 * fontScale), maxHeight: Math.max(MAX_KEY_HEIGHT, 32 * fontScale) };
    const confirmRowStyle = { minHeight: Math.max(48, 24 * fontScale), maxHeight: Math.max(60, 24 * fontScale) };
    const digitsStyle = { minHeight: rowStyle.minHeight * 4 + 24, maxHeight: rowStyle.maxHeight * 4 + 24 };

    return {
        rowStyle,
        confirmRowStyle,
        digitsStyle,
        keypadStyle: {
            minHeight: digitsStyle.minHeight + confirmRowStyle.minHeight + 16,
            maxHeight: digitsStyle.maxHeight + confirmRowStyle.maxHeight + 16
        }
    };
};
