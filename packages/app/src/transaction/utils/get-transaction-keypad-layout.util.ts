const MIN_KEY_HEIGHT = 44;
const MAX_KEY_HEIGHT = 64;
const MAX_ACTION_HEIGHT = 56;

export const getTransactionKeypadLayout = (fontScale: number) => {
    const rowStyle = { minHeight: Math.max(MIN_KEY_HEIGHT, 32 * fontScale), maxHeight: Math.max(MAX_KEY_HEIGHT, 32 * fontScale) };
    const confirmRowStyle = { minHeight: Math.max(48, 24 * fontScale), maxHeight: Math.max(MAX_ACTION_HEIGHT, 24 * fontScale) };
    const digitsStyle = { minHeight: rowStyle.minHeight * 4 + 24, maxHeight: rowStyle.maxHeight * 4 + 24 };

    return {
        rowStyle,
        confirmRowStyle,
        digitsStyle,
        keypadStyle: {
            minHeight: digitsStyle.minHeight + confirmRowStyle.minHeight + 8,
            maxHeight: digitsStyle.maxHeight + confirmRowStyle.maxHeight + 8
        }
    };
};
