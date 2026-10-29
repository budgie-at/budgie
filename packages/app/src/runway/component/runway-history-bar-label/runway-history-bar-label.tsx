import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly month: string;
    readonly expense: number;
    readonly income: number;
}

export const RunwayHistoryBarLabel = ({ month, expense, income }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatProtectedAmount = useProtectedAmountLabel();

    const expenseAmount = formatProtectedAmount(convertFromMicroUnits(expense), defaultInstrument.symbol);
    const incomeAmount = formatProtectedAmount(convertFromMicroUnits(income), defaultInstrument.symbol);

    return <View accessible accessibilityLabel={t`${month}, out ${expenseAmount}, in ${incomeAmount}`} className="flex-1" />;
};
