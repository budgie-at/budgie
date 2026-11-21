import { isNotEmptyString } from '@rnw-community/shared';

import { joinYieldSubtitle } from './join-yield-subtitle.util';

import type { YieldPayoutLabelsInputInterface } from '../interface/yield-payout-labels-input.interface';

export const buildYieldPayoutLabels = ({
    isMerged,
    isScoped,
    positionTitle,
    sourceTitle,
    baseTitle,
    kindLabel,
    dayLabel,
    fullDayLabel,
    countLabel
}: YieldPayoutLabelsInputInterface) => {
    if (isMerged) {
        return {
            title: isScoped ? kindLabel : (positionTitle ?? (isNotEmptyString(sourceTitle) ? sourceTitle : baseTitle)),
            subtitle: joinYieldSubtitle([isScoped ? null : kindLabel, countLabel, dayLabel])
        };
    }

    if (isScoped) {
        return { title: fullDayLabel, subtitle: kindLabel };
    }

    if (isNotEmptyString(positionTitle)) {
        return { title: positionTitle, subtitle: joinYieldSubtitle([kindLabel, dayLabel]) };
    }

    const isKindInTitle = baseTitle.toLowerCase().includes(kindLabel.toLowerCase());

    return { title: baseTitle, subtitle: joinYieldSubtitle([isKindInTitle ? null : kindLabel, dayLabel]) };
};
