import { YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import { useYieldAnalyticsPeriodText } from './use-yield-analytics-period-text.hook';
import { useYieldAnalyticsTakeaway } from './use-yield-analytics-takeaway.hook';

import type { YieldAnalyticsFocusInterface } from '../interface/yield-analytics-focus.interface';
import type { YieldPeriodInterface } from '../interface/yield-period.interface';
import type { YieldEstimatedFigureInterface, YieldSummaryInterface } from '@budgie/market';
import type { MessageDescriptor } from '@lingui/core';

const ESTIMATED_PREFIX = '≈ ';
const CHART_CAPTION: Readonly<Record<YieldRangeEnum, MessageDescriptor>> = {
    [YieldRangeEnum.MONTH]: msg`Last 30 days`,
    [YieldRangeEnum.QUARTER]: msg`Last 13 weeks`,
    [YieldRangeEnum.YEAR]: msg`Last 12 months`,
    [YieldRangeEnum.ALL]: msg`All time`
};

const CARD_TITLE: Readonly<Record<YieldRangeEnum, MessageDescriptor>> = {
    [YieldRangeEnum.MONTH]: msg`Passive income · last 30 days`,
    [YieldRangeEnum.QUARTER]: msg`Passive income · last 13 weeks`,
    [YieldRangeEnum.YEAR]: msg`Passive income · last 12 months`,
    [YieldRangeEnum.ALL]: msg`Passive income · all time`
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
    const periodText = useYieldAnalyticsPeriodText(summary, focus, period);
    const takeaway = useYieldAnalyticsTakeaway(summary, focus.range);

    const isFocused = isDefined(focus.focusDay);
    const headline = isFocused && isDefined(summary) ? summary.earned : earned;
    const headlineText = `${headline.isEstimated ? ESTIMATED_PREFIX : ''}${formatAmount(headline.value, symbol)}`;
    const caption = isFocused ? t(CHART_CAPTION[focus.range]) : periodText;
    const focusedText = isFocused
        ? `${earned.isEstimated ? ESTIMATED_PREFIX : ''}${formatAmount(earned.value, symbol)} ${periodText}`
        : null;
    const visibleTakeaway = isFocused ? takeaway : null;
    const title = t(CARD_TITLE[focus.range]);
    const spoken = [`${title}, ${headlineText} ${caption}`, focusedText, visibleTakeaway].filter(isDefined).join(', ');
    const accessibilityLabel = `${spoken}. ${t`Opens Passive income`}`;

    return { title, headlineText, caption, focusedText, takeaway: visibleTakeaway, accessibilityLabel };
};
