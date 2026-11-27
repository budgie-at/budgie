import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_NEUTRAL_RATIO } from '../constant/yield-neutral-ratio.constant';
import { YIELD_TREND_ARROW } from '../constant/yield-trend-arrow.constant';
import { YieldDeltaToneEnum } from '../enum/yield-delta-tone.enum';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';
import { roundYieldDifference } from '../utils/round-yield-difference.util';

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

export const useYieldScrubDeltaFigures = (current: number, previous: number) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const formatPercent = useFormatPercent();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    const change = roundYieldDifference(current, previous, decimalPlaces);
    const direction = Math.sign(change);
    const amount = formatAmount(Math.abs(change), symbol);
    const sign = DIRECTION_SIGN[direction];
    const percent = formatPercent(Math.abs(change) / Math.abs(previous));
    const figures = previous === 0 ? `${sign}${amount}` : t`${sign}${amount} · ${sign}${percent}`;
    const isFlat = direction === 0 || (previous !== 0 && Math.abs(change) / Math.abs(previous) < YIELD_NEUTRAL_RATIO);
    const arrow = isFlat ? '' : YIELD_TREND_ARROW[DIRECTION_TREND[direction]];

    return {
        label: direction === 0 ? t`No change` : `${arrow}${figures}`,
        tone: isFlat ? YieldDeltaToneEnum.NEUTRAL : DIRECTION_TONE[direction],
        isFlat
    };
};
