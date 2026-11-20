import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_TREND_ARROW } from '../../constant/yield-trend-arrow.constant';
import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';
import { YieldHeroTrendEnum } from '../../enum/yield-hero-trend.enum';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { roundYieldDelta } from '../../utils/round-yield-delta.util';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly bucket: YieldBucketInterface;
    readonly previous: YieldBucketInterface;
    readonly unit: YieldBucketUnitEnum;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;
const DIRECTION_TREND: Readonly<Record<number, YieldHeroTrendEnum>> = {
    1: YieldHeroTrendEnum.UP,
    0: YieldHeroTrendEnum.NONE,
    [-1]: YieldHeroTrendEnum.DOWN
};
const DIRECTION_TONE: Readonly<Record<number, YieldDeltaToneEnum>> = {
    1: YieldDeltaToneEnum.POSITIVE,
    0: YieldDeltaToneEnum.NEUTRAL,
    [-1]: YieldDeltaToneEnum.NEGATIVE
};
const DIRECTION_SIGN: Readonly<Record<number, string>> = { 1: '+', 0: '', [-1]: '−' };

export const YieldHeroScrubDeltaChip = ({ bucket, previous, unit }: Props) => {
    const { t } = useLingui();
    const { formatTick } = useYieldDateLabels();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    const change = roundYieldDelta(bucket.total, previous.total, decimalPlaces);
    const direction = Math.sign(change);
    const amount = formatAmount(Math.abs(change), symbol);
    const sign = DIRECTION_SIGN[direction];
    const previousLabel = formatTick(previous, unit);
    const arrow = YIELD_TREND_ARROW[DIRECTION_TREND[direction]];
    const label = direction === 0 ? t`No change vs ${previousLabel}` : `${arrow}${t`${sign}${amount} vs ${previousLabel}`}`;

    return <YieldDeltaPill label={label} tone={DIRECTION_TONE[direction]} maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER} />;
};
