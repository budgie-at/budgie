import { useState } from 'react';

import type { TransactionInfoHandoffInterface } from '../interface/transaction-info-handoff.interface';
import type { LayoutChangeEvent } from 'react-native';

const HANDOFF_FADE_DISTANCE = 40;
const MINIMUM_TEXT_FADE_DISTANCE = 12;
const TEXT_CLEARANCE = 4;
const COMPACT_OVERLAP = 0.3;

export const useTransactionInfoHeroHandoff = (animated: boolean, bodyTop: number) => {
    const [amountTop, setAmountTop] = useState(Number.MAX_SAFE_INTEGER);
    const [textBottom, setTextBottom] = useState(0);
    const fadeDistance = animated ? HANDOFF_FADE_DISTANCE : Math.max(1, Math.min(HANDOFF_FADE_DISTANCE, amountTop / 2));
    const textFadeEnd = animated
        ? Math.max(MINIMUM_TEXT_FADE_DISTANCE, Math.min(fadeDistance, bodyTop - textBottom - TEXT_CLEARANCE))
        : fadeDistance;
    const handoffEnd = textFadeEnd + fadeDistance;
    const handoff: TransactionInfoHandoffInterface = {
        textFadeRange: [0, textFadeEnd],
        amountFadeRange: [textFadeEnd, handoffEnd],
        compactTitleRange: [textFadeEnd * (1 - COMPACT_OVERLAP), textFadeEnd],
        compactAmountRange: [handoffEnd - fadeDistance * COMPACT_OVERLAP, handoffEnd],
        heroTravel: animated ? Math.max(0, handoffEnd - amountTop) : 0
    };

    return {
        handoff,
        onAmountLayout: (event: LayoutChangeEvent) => void setAmountTop(Math.max(0, event.nativeEvent.layout.y)),
        onTextLayout: (event: LayoutChangeEvent) => void setTextBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)
    };
};
