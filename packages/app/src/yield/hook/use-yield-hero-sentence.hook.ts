import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural, select } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';
import { useYieldHeroTrend } from './use-yield-hero-trend.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroSentence = (summary: YieldSummaryInterface | null, rangeCaption: string): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();
    const formatAmount = useProtectedAmountLabel();
    const isAmountProtected = useIsAmountProtected();
    const { trend, change, isEstimated } = useYieldHeroTrend(summary);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    if (!isDefined(summary)) {
        return rangeCaption;
    }

    const amount = isAmountProtected ? t`hidden amount` : formatAmount(summary.earned.value, symbol);
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
