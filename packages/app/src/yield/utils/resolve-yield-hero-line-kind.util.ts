import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YieldHeroLineKindEnum } from '../enum/yield-hero-line-kind.enum';

import type { YieldHeroLineInputInterface } from '../interface/yield-hero-line-input.interface';

export const resolveYieldHeroLineKind = ({ isScrubbing, bucketTax, group, rate }: YieldHeroLineInputInterface): YieldHeroLineKindEnum => {
    if (isScrubbing) {
        return isPositiveNumber(bucketTax) ? YieldHeroLineKindEnum.SCRUB_NET : YieldHeroLineKindEnum.SCRUB_EMPTY;
    }

    if (isDefined(group)) {
        return YieldHeroLineKindEnum.SHARE;
    }

    return isDefined(rate) ? YieldHeroLineKindEnum.RATE : YieldHeroLineKindEnum.UNAVAILABLE;
};
