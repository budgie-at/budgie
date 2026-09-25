import type { ReactNode } from 'react';

const FIRST_ROW_TOP_REM = 5;
const ROW_PITCH_REM = 3.4;
const ROW_HEIGHT_REM = 3;
const CARD_HEIGHT_REM = 5.25;
const FIRST_CARD_TOP_REM = 6.5;
const CARD_PITCH_REM = 5.75;
const SECTION_LABEL_REM = 1.5;
const TRANSFER_SLOT = 2;
const OFFSET_PRECISION = 3;

interface Props {
    readonly index: number;
    readonly slot: number;
    readonly amount: string;
    readonly children: ReactNode;
}

export const CategorizeDemoRawRow = ({ index, slot, amount, children }: Props) => {
    const top = FIRST_ROW_TOP_REM + index * ROW_PITCH_REM;
    const cardTop = FIRST_CARD_TOP_REM + slot * CARD_PITCH_REM + (slot >= TRANSFER_SLOT ? SECTION_LABEL_REM : 0);
    const offset = cardTop + (CARD_HEIGHT_REM - ROW_HEIGHT_REM) / 2 - top;
    const position = { top: `${top}rem` };

    return (
        <div className="cdemo-raw" data-cdemo-dy={offset.toFixed(OFFSET_PRECISION)} style={position}>
            <span className="cdemo-raw-title">{children}</span>
            <span className="cdemo-amount">{amount}</span>
        </div>
    );
};
