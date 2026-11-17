import { plural, select } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatYieldRate } from './use-format-yield-rate.hook';
import { useYieldHeroTrend } from './use-yield-hero-trend.hook';
import { useYieldScrubSentence } from './use-yield-scrub-sentence.hook';
import { useYieldSpokenAmount } from './use-yield-spoken-amount.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroSentence = (
    summary: YieldSummaryInterface | null,
    rangeCaption: string,
    bucket: YieldBucketInterface | null,
    scrubAmount: number
): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();
    const amountOf = useYieldSpokenAmount();
    const { trend, change, isEstimated } = useYieldHeroTrend(summary);
    const scrubSentence = useYieldScrubSentence(summary, bucket, scrubAmount);

    if (isDefined(scrubSentence)) {
        return scrubSentence;
    }

    if (!isDefined(summary)) {
        return rangeCaption;
    }

    const amount = amountOf(summary.earned.value);
    const rate = isDefined(summary.annualYield.rate) ? formatRate(summary.annualYield.rate) : t`no yield yet`;
    const count = summary.annualYield.holdingCount;
    const sentence = t({
        id: 'passive-income.hero.sentence',
        message: plural(count, {
            one: select(trend, {
                up: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holding, up ${change}.`,
                down: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holding, down ${change}.`,
                new: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holding, new this period.`,
                other: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holding.`
            }),
            other: select(trend, {
                up: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holdings, up ${change}.`,
                down: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holdings, down ${change}.`,
                new: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holdings, new this period.`,
                other: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across ${count} holdings.`
            })
        })
    });

    return isEstimated ? [sentence, t`Includes estimated values.`].join(' ') : sentence;
};
