import { TRANSACTION_KEYPAD_MAX_FONT_SCALE } from '../constant/transaction-keypad-max-font-scale.constant';

const KEY_HEIGHT = 44;
const MIN_FORM_VIEWPORT_HEIGHT = 120;

export const getTransactionKeypadLayout = (fontScale: number, availableHeight = Infinity) => {
    const rowHeight = Math.max(KEY_HEIGHT, 32 * Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE));
    const actionHeight = Math.max(50, 24 * Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE));
    const digitsHeight = rowHeight * 4 + 18;
    const footerHeight = digitsHeight + actionHeight + 28;

    return {
        requiresScrolling: footerHeight + MIN_FORM_VIEWPORT_HEIGHT > availableHeight,
        rowStyle: { minHeight: rowHeight, maxHeight: rowHeight },
        confirmRowStyle: { minHeight: actionHeight },
        digitsStyle: { minHeight: digitsHeight, maxHeight: digitsHeight }
    };
};
