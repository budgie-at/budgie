import { isDefined } from '@rnw-community/shared';

import { YieldHeroLineKindEnum } from '../enum/yield-hero-line-kind.enum';

import type { YieldHeroLineInputInterface } from '../interface/yield-hero-line-input.interface';

export const resolveYieldHeroLineKind = ({ isScrubbing, group }: YieldHeroLineInputInterface): YieldHeroLineKindEnum => {
    if (isScrubbing) {
        return YieldHeroLineKindEnum.SCRUB_NET;
    }

    return isDefined(group) ? YieldHeroLineKindEnum.SHARE : YieldHeroLineKindEnum.RANGE_NET;
};
