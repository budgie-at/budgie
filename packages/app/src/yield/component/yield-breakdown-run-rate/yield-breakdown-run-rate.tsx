import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { useWindowDimensions } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldEstimatedFigureInterface } from '@budgie/market';

interface Props {
    readonly runRate: YieldEstimatedFigureInterface;
}

const NARROW_WIDTH = 380;

export const YieldBreakdownRunRate = ({ runRate }: Props) => {
    const { t } = useLingui();
    const { width } = useWindowDimensions();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amount = formatAmount(runRate.value, symbol);
    const title = width < NARROW_WIDTH ? t`Next 12 months` : t`Projected next 12 months`;

    return (
        <YieldBreakdownRow
            title={title}
            subtitle={t`At today’s balances and rates`}
            value={t`≈ ${amount}`}
            testID={PassiveIncomeSelector.RunRate}
        />
    );
};
