import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

interface Props {
    readonly earned: number;
    readonly isEstimated: boolean;
}

export const YieldBreakdownEarned = ({ earned, isEstimated }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amount = formatAmount(earned, symbol);
    const value = isEstimated ? t`≈ ${amount}` : amount;

    return <YieldBreakdownRow title={t`Earned`} subtitle={t`Before tax`} value={value} testID={PassiveIncomeSelector.BreakdownEarned} />;
};
