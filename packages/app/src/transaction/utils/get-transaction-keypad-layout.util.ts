import { SUGGESTION_ROW_HEIGHT } from '../constant/suggestion-row-height.constant';
import { TRANSACTION_KEYPAD_MAX_FONT_SCALE } from '../constant/transaction-keypad-max-font-scale.constant';

const KEY_HEIGHT = 48;
const MAX_KEY_HEIGHT = 52;
const KEYPAD_SCREEN_RATIO = 16;
const MIN_FORM_VIEWPORT_HEIGHT = 120;

export const getTransactionKeypadLayout = (fontScale: number, availableHeight = Infinity) => {
    const rowHeight = Math.max(
        KEY_HEIGHT,
        Math.min(MAX_KEY_HEIGHT, availableHeight / KEYPAD_SCREEN_RATIO),
        32 * Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE)
    );
    const actionHeight = Math.max(50, 24 * Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE));
    const digitsHeight = rowHeight * 4 + 24;
    const footerHeight = digitsHeight + actionHeight + SUGGESTION_ROW_HEIGHT + 36;

    return {
        requiresScrolling: footerHeight + MIN_FORM_VIEWPORT_HEIGHT > availableHeight,
        rowStyle: { minHeight: rowHeight, maxHeight: rowHeight },
        confirmRowStyle: { minHeight: actionHeight },
        digitsStyle: { minHeight: digitsHeight, maxHeight: digitsHeight }
    };
};
