import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_TREND_ARROW } from '../../constant/yield-trend-arrow.constant';
import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';
import { YieldHeroTrendEnum } from '../../enum/yield-hero-trend.enum';
import { roundYieldDelta } from '../../utils/round-yield-delta.util';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

interface Props {
    readonly current: number;
    readonly previous: number;
    readonly comparison: string;
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

export const YieldHeroScrubDeltaChip = ({ current, previous, comparison }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const formatPercent = useFormatPercent();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    const change = roundYieldDelta(current, previous, decimalPlaces);
    const direction = Math.sign(change);
    const amount = formatAmount(Math.abs(change), symbol);
    const sign = DIRECTION_SIGN[direction];
    const arrow = YIELD_TREND_ARROW[DIRECTION_TREND[direction]];
    const percent = formatPercent(Math.abs(change) / Math.abs(previous));
    const figures = previous === 0 ? `${sign}${amount}` : t`${sign}${amount} · ${sign}${percent}`;
    const label = direction === 0 ? t`No change` : `${arrow}${figures}`;

    return (
        <YieldDeltaPill
            label={label}
            caption={comparison}
            tone={DIRECTION_TONE[direction]}
            maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}
        />
    );
};
