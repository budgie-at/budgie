import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
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
    const { trend, estimates } = useYieldHeroTrend(summary);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    if (!isDefined(summary)) {
        return rangeCaption;
    }

    const amount = isAmountProtected ? t`hidden amount` : formatAmount(summary.earned.value, symbol);
    const rate = isDefined(summary.annualYield.rate) ? formatRate(summary.annualYield.rate) : t`no yield yet`;
    const count = summary.annualYield.holdingCount;

    return t({
        id: 'passive-income.hero.sentence',
        message: plural(count, {
            one: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across # holding${trend}${estimates}`,
            other: `Earned ${amount} before tax ${rangeCaption}, ${rate} a year across # holdings${trend}${estimates}`
        })
    });
};
