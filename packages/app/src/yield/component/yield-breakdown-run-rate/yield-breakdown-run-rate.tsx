import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldEstimatedFigureInterface } from '@budgie/market';

interface Props {
    readonly runRate: YieldEstimatedFigureInterface;
}

export const YieldBreakdownRunRate = ({ runRate }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amount = formatAmount(runRate.value, symbol);

    return (
        <YieldBreakdownRow
            title={t`Projected next 12 months`}
            subtitle={t`At today’s balances and rates`}
            value={t`≈ ${amount}`}
            testID={PassiveIncomeSelector.RunRate}
        />
    );
};
