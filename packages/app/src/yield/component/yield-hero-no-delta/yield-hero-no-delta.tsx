import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;

export const YieldHeroNoDelta = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    const { range } = screenKey.key;
    const hasEarlierPeriod =
        range !== YieldRangeEnum.ALL && isDefined(summary.firstYieldDay) && summary.firstYieldDay < summary.windowStart;
    const previousPeriods: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`No payouts in previous 30 days`,
        [YieldRangeEnum.QUARTER]: t`No payouts in previous 3 months`,
        [YieldRangeEnum.YEAR]: t`No payouts in previous year`,
        [YieldRangeEnum.ALL]: t`No earlier period to compare`
    };
    const text = hasEarlierPeriod ? previousPeriods[range] : t`No earlier period to compare`;

    return <YieldDeltaPill label={text} tone={YieldDeltaToneEnum.NEUTRAL} maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER} />;
};
