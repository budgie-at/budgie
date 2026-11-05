import { TRANSACTION_KEYPAD_MAX_FONT_SCALE } from '../constant/transaction-keypad-max-font-scale.constant';

const KEY_HEIGHT = 44;
const MIN_FORM_VIEWPORT_HEIGHT = 120;

export const getTransactionKeypadLayout = (fontScale: number, availableHeight = Infinity, footerHeight?: number) => {
    const rowHeight = Math.max(KEY_HEIGHT, 32 * Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE));
    const actionHeight = Math.max(48, 24 * fontScale);
    const digitsHeight = rowHeight * 4 + 24;
    const keypadHeight = footerHeight ?? digitsHeight + actionHeight + 8;

    return {
        requiresScrolling: keypadHeight + MIN_FORM_VIEWPORT_HEIGHT * Math.min(fontScale, 2) > availableHeight,
        rowStyle: { minHeight: rowHeight, maxHeight: rowHeight },
        confirmRowStyle: { minHeight: actionHeight, maxHeight: actionHeight },
        digitsStyle: { minHeight: digitsHeight, maxHeight: digitsHeight },
        keypadStyle: { minHeight: keypadHeight, maxHeight: keypadHeight }
    };
};
