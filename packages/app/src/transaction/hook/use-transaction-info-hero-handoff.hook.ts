import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { TRANSACTION_INFO_HERO_MAX_FONT_SCALE } from '../constant/transaction-info-hero-max-font-scale.constant';

import type { TransactionInfoHandoffInterface } from '../interface/transaction-info-handoff.interface';
import type { LayoutChangeEvent } from 'react-native';

const COMPACT_REVEAL_DISTANCE = 12;
const TITLE_DESCENT = 6;

export const useTransactionInfoHeroHandoff = (animated: boolean) => {
    const { fontScale } = useWindowDimensions();
    const [amountTop, setAmountTop] = useState(Number.MAX_SAFE_INTEGER);
    const [titleBottom, setTitleBottom] = useState(Number.MAX_SAFE_INTEGER);
    const revealDistance = animated ? COMPACT_REVEAL_DISTANCE : 1;
    const titleBaseline = titleBottom - TITLE_DESCENT * Math.min(fontScale, TRANSACTION_INFO_HERO_MAX_FONT_SCALE);
    const getRevealRange = (crossing: number): readonly [number, number] => [Math.max(0, crossing - revealDistance), Math.max(1, crossing)];
    const handoff: TransactionInfoHandoffInterface = {
        compactTitleRange: getRevealRange(titleBaseline),
        compactAmountRange: getRevealRange(amountTop)
    };

    return {
        handoff,
        onAmountLayout: (event: LayoutChangeEvent) => void setAmountTop(event.nativeEvent.layout.y),
        onTitleLayout: (event: LayoutChangeEvent) => void setTitleBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)
    };
};
