import { useLingui } from '@lingui/react/macro';

import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldCryptoRewardsInterface } from '@budgie/market';

interface Props {
    readonly rewards: YieldCryptoRewardsInterface;
}

export const YieldBreakdownCryptoToday = ({ rewards }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();

    const amount = formatAmount(rewards.value);
    const arrival = formatAmount(rewards.arrivalValue);
    const value = rewards.isEstimated ? t`≈ ${amount}` : amount;

    return (
        <YieldBreakdownRow
            title={t`Crypto rewards today`}
            subtitle={t`${arrival} when received`}
            value={value}
            testID={PassiveIncomeSelector.CryptoToday}
        />
    );
};
