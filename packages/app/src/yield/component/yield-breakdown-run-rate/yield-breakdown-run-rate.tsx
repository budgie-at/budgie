import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { StatCell } from '../../../@generic/component/stat-cell/stat-cell';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldEstimatedFigureInterface } from '@budgie/market';

interface Props {
    readonly runRate: YieldEstimatedFigureInterface;
}

export const YieldBreakdownRunRate = ({ runRate }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amount = formatAmount(runRate.value, symbol);
    const value = runRate.isEstimated ? t`≈ ${amount} a year` : t`${amount} a year`;

    return <StatCell label={t`At this pace`} value={value} variant="default" testID={PassiveIncomeSelector.RunRate} />;
};
