import { YieldGroupEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldSpokenAmount } from './use-yield-spoken-amount.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

export const useYieldScrubSentence = (
    summary: YieldSummaryInterface | null,
    bucket: YieldBucketInterface | null,
    scrubAmount: number
): string | null => {
    const { t } = useLingui();
    const { mode } = use(YieldScreenContext);
    const { formatPeriod } = useYieldDateLabels();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const amountOf = useYieldSpokenAmount();

    if (!isDefined(summary) || !isDefined(bucket)) {
        return null;
    }

    const amountText = amountOf(scrubAmount);
    const bucketTax = bucket.amounts[YieldGroupEnum.TAX];
    const netText = amountOf(bucket.total, bucketTax);
    const period = formatPeriod(bucket, summary.bucketUnit);
    const throughDay = formatDayAndMonthAndYear(parseISO(bucket.end));
    const barsSentence = isPositiveNumber(bucketTax)
        ? t`${period}: earned ${amountText} before tax, ${netText} after tax.`
        : t`${period}: earned ${amountText} before tax.`;
    const sentence = mode === YieldChartModeEnum.RUNNING_TOTAL ? t`Earned ${amountText} before tax through ${throughDay}.` : barsSentence;

    return bucket.isEstimated ? [sentence, t`Includes estimated values.`].join(' ') : sentence;
};
