import { YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';

import { useYieldAnalyticsPeriodLabel } from './use-yield-analytics-period-label.hook';
import { useYieldDeltaLabel } from './use-yield-delta-label.hook';

import type { YieldAnalyticsFocusInterface } from '../interface/yield-analytics-focus.interface';
import type { YieldPeriodInterface } from '../interface/yield-period.interface';
import type { YieldEstimatedFigureInterface, YieldSummaryInterface } from '@budgie/market';
import type { MessageDescriptor } from '@lingui/core';

const ESTIMATED_PREFIX = '≈ ';
const RANGE_CAPTION: Readonly<Record<YieldRangeEnum, MessageDescriptor>> = {
    [YieldRangeEnum.MONTH]: msg`in the last 30 days`,
    [YieldRangeEnum.QUARTER]: msg`in the last 13 weeks`,
    [YieldRangeEnum.YEAR]: msg`in the last 12 months`,
    [YieldRangeEnum.ALL]: msg`all time`
};

export const useYieldAnalyticsCardText = (
    summary: YieldSummaryInterface | null,
    earned: YieldEstimatedFigureInterface,
    focus: YieldAnalyticsFocusInterface,
    period: YieldPeriodInterface
) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const periodText = useYieldAnalyticsPeriodLabel(summary, focus, period);
    const { label, caption: comparison, trend, tone } = useYieldDeltaLabel(summary, focus.range);

    const isFocused = isDefined(focus.focusDay);
    const headline = isFocused && isDefined(summary) ? summary.earned : earned;
    const headlineText = `${headline.isEstimated ? ESTIMATED_PREFIX : ''}${formatAmount(headline.value, symbol)}`;
    const caption = isFocused ? t(RANGE_CAPTION[focus.range]) : periodText;
    const focusedText = isFocused
        ? `${earned.isEstimated ? ESTIMATED_PREFIX : ''}${formatAmount(earned.value, symbol)} ${periodText}`
        : null;
    const isTrending = trend === YieldHeroTrendEnum.UP || trend === YieldHeroTrendEnum.DOWN;
    const visibleTakeaway = isFocused && isTrending ? `${label} ${comparison}` : null;
    const title = t`Passive income`;
    const spoken = [`${title}, ${headlineText} ${caption}`, focusedText, visibleTakeaway].filter(isDefined).join(', ');

    return {
        title,
        headlineText,
        caption,
        focusedText,
        takeaway: visibleTakeaway,
        tone,
        accessibilityLabel: `${spoken}. ${t`Opens Passive income`}`
    };
};
