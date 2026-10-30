import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { TRANSACTION_INFO_HERO_MAX_FONT_SCALE } from '../constant/transaction-info-hero-max-font-scale.constant';

import type { TransactionInfoHandoffInterface } from '../interface/transaction-info-handoff.interface';
import type { LayoutChangeEvent } from 'react-native';

const CAP_TOP_FRACTION = 0.2;
const REVEALED_FRACTION = 0.46;
const TITLE_LINE_HEIGHT = 25;

export const useTransactionInfoHeroHandoff = (animated: boolean, maxScroll: number) => {
    const { fontScale } = useWindowDimensions();
    const [amountLine, setAmountLine] = useState({ top: Number.MAX_SAFE_INTEGER, height: 0 });
    const [titleBottom, setTitleBottom] = useState(Number.MAX_SAFE_INTEGER);
    const titleLineHeight = TITLE_LINE_HEIGHT * Math.min(fontScale, TRANSACTION_INFO_HERO_MAX_FONT_SCALE);
    const getRevealRange = (lineTop: number, lineHeight: number): readonly [number, number] => {
        const coverStart = Math.max(1, lineTop + lineHeight * CAP_TOP_FRACTION);
        const revealed = coverStart + lineHeight * REVEALED_FRACTION;
        const reachableRevealed = maxScroll > coverStart ? Math.min(revealed, maxScroll) : revealed;

        return animated ? [coverStart, Math.max(reachableRevealed, coverStart + 1)] : [reachableRevealed - 1, reachableRevealed];
    };
    const handoff: TransactionInfoHandoffInterface = {
        compactTitleRange: getRevealRange(titleBottom - titleLineHeight, titleLineHeight),
        compactAmountRange: getRevealRange(amountLine.top, amountLine.height)
    };

    return {
        handoff,
        onAmountLayout: (event: LayoutChangeEvent) =>
            void setAmountLine({ top: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height }),
        onTitleLayout: (event: LayoutChangeEvent) => void setTitleBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)
    };
};
