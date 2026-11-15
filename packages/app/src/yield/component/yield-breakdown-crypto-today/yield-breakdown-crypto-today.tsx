import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { StatCell } from '../../../@generic/component/stat-cell/stat-cell';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

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
        <View>
            <StatCell label={t`Crypto rewards today`} value={value} variant="default" testID={PassiveIncomeSelector.CryptoToday} />
            <Text className="text-center text-xs text-secondary-foreground">{t`${arrival} on arrival`}</Text>
        </View>
    );
};
