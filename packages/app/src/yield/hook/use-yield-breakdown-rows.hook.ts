import { useLingui } from '@lingui/react/macro';
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { PassiveIncomeSelector } from '../selector/passive-income.selector';

import { useFormatYieldFigureAmount } from './use-format-yield-figure-amount.hook';
import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldBreakdownRowInterface } from '../interface/yield-breakdown-row.interface';
import type { YieldSummaryInterface } from '@budgie/market';

const DAYS_PER_MONTH = 30.4375;
const MIN_AVERAGE_MONTHS = 2;
const SECONDARY_VALUE_CLASSNAME = 'text-right text-[17px] tabular-nums text-secondary-foreground';

export const useYieldBreakdownRows = (summary: YieldSummaryInterface | null): readonly YieldBreakdownRowInterface[] => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const formatAmount = useFormatYieldFigureAmount();
    const formatRate = useFormatYieldRate();

    if (!isDefined(summary) || !summary.hasYield || summary.payoutCount === 1) {
        return [];
    }

    const { tax, net, cryptoRewardsToday, vsRate, annualYield } = summary;
    const monthCount = Math.round(differenceInDays(parseISO(summary.today), parseISO(summary.windowStart)) / DAYS_PER_MONTH);
    const rate = isDefined(screenKey.key.group) ? annualYield.rate : null;

    return [
        isPositiveNumber(tax)
            ? {
                  title: t`Tax withheld`,
                  value: t`−${{ amount: formatAmount(tax) }}`,
                  testID: PassiveIncomeSelector.TaxWithheld,
                  valueClassName: SECONDARY_VALUE_CLASSNAME
              }
            : null,
        isPositiveNumber(tax) ? { title: t`Net after tax`, value: formatAmount(net), testID: PassiveIncomeSelector.NetAfterTax } : null,
        monthCount >= MIN_AVERAGE_MONTHS
            ? {
                  title: t`Monthly average`,
                  subtitle: t`Before tax`,
                  value: formatAmount(summary.earned.value / monthCount),
                  testID: PassiveIncomeSelector.MonthlyAverage
              }
            : null,
        isDefined(rate)
            ? {
                  title: t`Yield · last 12 months`,
                  value: annualYield.isEstimated ? t`≈ ${{ formattedRate: formatRate(rate) }}` : formatRate(rate),
                  testID: PassiveIncomeSelector.YieldRate
              }
            : null,
        isDefined(cryptoRewardsToday)
            ? {
                  title: t`Crypto rewards at today’s prices`,
                  subtitle: t`${{ arrival: formatAmount(cryptoRewardsToday.arrivalValue) }} when received`,
                  value: cryptoRewardsToday.isEstimated
                      ? t`≈ ${{ amount: formatAmount(cryptoRewardsToday.value) }}`
                      : formatAmount(cryptoRewardsToday.value),
                  testID: PassiveIncomeSelector.CryptoToday
              }
            : null,
        isDefined(vsRate)
            ? {
                  title: t`Yield vs expected`,
                  value: t`${{ actual: isDefined(vsRate.actual) ? formatRate(vsRate.actual) : '—' }} vs ${{ expected: formatRate(vsRate.expected) }}`,
                  testID: PassiveIncomeSelector.VsRate
              }
            : null
    ].filter(isDefined);
};
