import { YieldPositionSectionEnum } from '@budgie/market';

import { joinYieldSubtitle } from '../utils/join-yield-subtitle.util';

import { useYieldPositionKindLabel } from './use-yield-position-kind-label.hook';
import { useYieldPositionRateText } from './use-yield-position-rate-text.hook';

import type { YieldPositionSummaryInterface } from '@budgie/market';

export const useYieldPositionSubtitle = (
    position: Pick<YieldPositionSummaryInterface, 'accountType' | 'instrumentType' | 'kind' | 'annualYield' | 'section'>
): string => {
    const kindLabel = useYieldPositionKindLabel(position);
    const rateText = useYieldPositionRateText(position.annualYield, position.section === YieldPositionSectionEnum.CLOSED);

    return joinYieldSubtitle([kindLabel, rateText]);
};
