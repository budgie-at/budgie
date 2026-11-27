import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';

import { useYieldDateLabels } from './use-yield-date-labels.hook';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

export const useYieldScrubCaption = (previousBucket: YieldBucketInterface | null, unit: YieldBucketUnitEnum, isFlat: boolean): string => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { formatTick } = useYieldDateLabels();

    if (isDefined(previousBucket)) {
        const previousLabel = formatTick(previousBucket, unit);

        return isFlat ? t`about the same as ${previousLabel}` : t`vs ${previousLabel}`;
    }

    const isYear = screenKey.key.range === YieldRangeEnum.YEAR;

    if (isFlat) {
        return isYear ? t`about the same as this point last year` : t`about the same as this point last period`;
    }

    return isYear ? t`vs same point last year` : t`vs same point last period`;
};
