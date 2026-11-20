import { isNotEmptyString } from '@rnw-community/shared';

import { joinYieldSubtitle } from './join-yield-subtitle.util';

import type { YieldPayoutLabelsInputInterface } from '../interface/yield-payout-labels-input.interface';

export const buildYieldPayoutLabels = ({
    isMerged,
    positionTitle,
    sourceTitle,
    baseTitle,
    kindLabel,
    dayLabel,
    countLabel
}: YieldPayoutLabelsInputInterface) => {
    if (isMerged) {
        return {
            title: positionTitle ?? (isNotEmptyString(sourceTitle) ? sourceTitle : baseTitle),
            subtitle: joinYieldSubtitle([countLabel, dayLabel])
        };
    }

    if (isNotEmptyString(positionTitle)) {
        return { title: positionTitle, subtitle: joinYieldSubtitle([kindLabel, dayLabel, sourceTitle]) };
    }

    const isKindInTitle = baseTitle.toLowerCase().includes(kindLabel.toLowerCase());

    return { title: baseTitle, subtitle: joinYieldSubtitle([dayLabel, isKindInTitle ? null : kindLabel, sourceTitle]) };
};
