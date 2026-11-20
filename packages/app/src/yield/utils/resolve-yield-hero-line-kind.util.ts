import { YieldRangeEnum } from '@budgie/market';

import { isDefined } from '@rnw-community/shared';

import { YieldHeroLineKindEnum } from '../enum/yield-hero-line-kind.enum';

import type { YieldHeroLineInputInterface } from '../interface/yield-hero-line-input.interface';

export const resolveYieldHeroLineKind = ({ isScrubbing, group, range, rate }: YieldHeroLineInputInterface): YieldHeroLineKindEnum => {
    if (isScrubbing) {
        return YieldHeroLineKindEnum.SCRUB_NET;
    }

    if (isDefined(group)) {
        return YieldHeroLineKindEnum.SHARE;
    }

    if (range !== YieldRangeEnum.YEAR) {
        return YieldHeroLineKindEnum.RANGE_NET;
    }

    return isDefined(rate) ? YieldHeroLineKindEnum.RATE : YieldHeroLineKindEnum.UNAVAILABLE;
};
