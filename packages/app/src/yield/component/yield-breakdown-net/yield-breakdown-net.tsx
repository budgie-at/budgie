import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { StatCell } from '../../../@generic/component/stat-cell/stat-cell';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

interface Props {
    readonly net: number;
}

export const YieldBreakdownNet = ({ net }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (
        <StatCell label={t`Net after tax`} value={formatAmount(net, symbol)} variant="default" testID={PassiveIncomeSelector.NetAfterTax} />
    );
};
