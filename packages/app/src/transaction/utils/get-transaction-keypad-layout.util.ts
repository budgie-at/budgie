import { TRANSACTION_KEYPAD_MAX_FONT_SCALE } from '../constant/transaction-keypad-max-font-scale.constant';

import { isCompactTransactionForm } from './is-compact-transaction-form.util';

const KEY_HEIGHT = 48;
const COMPACT_KEY_HEIGHT = 44;
const MAX_KEY_HEIGHT = 52;
const ROW_GAP = 8;
const COMPACT_ROW_GAP = 6;
const ACTION_HEIGHT = 50;
const COMPACT_ACTION_HEIGHT = 44;
const KEYPAD_SCREEN_RATIO = 16;

export const getTransactionKeypadLayout = (fontScale: number, availableHeight = Infinity) => {
    const isCompact = isCompactTransactionForm(fontScale, availableHeight);
    const scaledFont = Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE);
    const rowGap = isCompact ? COMPACT_ROW_GAP : ROW_GAP;
    const rowHeight = Math.max(
        isCompact ? COMPACT_KEY_HEIGHT : KEY_HEIGHT,
        Math.min(MAX_KEY_HEIGHT, availableHeight / KEYPAD_SCREEN_RATIO),
        32 * scaledFont
    );
    const actionHeight = Math.max(isCompact ? COMPACT_ACTION_HEIGHT : ACTION_HEIGHT, 24 * scaledFont);
    const digitsHeight = rowHeight * 4 + rowGap * 3;

    return {
        rowStyle: { minHeight: rowHeight, maxHeight: rowHeight, ...(isCompact && { columnGap: rowGap }) },
        confirmRowStyle: { minHeight: actionHeight },
        digitsStyle: { minHeight: digitsHeight, maxHeight: digitsHeight, gap: rowGap }
    };
};
