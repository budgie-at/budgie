import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

interface Props {
    readonly net: number;
}

export const YieldBreakdownNet = ({ net }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return <YieldBreakdownRow title={t`Net after tax`} value={formatAmount(net, symbol)} testID={PassiveIncomeSelector.NetAfterTax} />;
};
