import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldCryptoRewardsInterface } from '@budgie/market';

interface Props {
    readonly rewards: YieldCryptoRewardsInterface;
}

export const YieldBreakdownCryptoToday = ({ rewards }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amount = formatAmount(rewards.value, symbol);
    const arrival = formatAmount(rewards.arrivalValue, symbol);
    const value = rewards.isEstimated ? t`≈ ${amount}` : amount;

    return (
        <YieldBreakdownRow
            title={t`Rewards now worth`}
            subtitle={t`${arrival} when received`}
            value={value}
            testID={PassiveIncomeSelector.CryptoToday}
        />
    );
};
