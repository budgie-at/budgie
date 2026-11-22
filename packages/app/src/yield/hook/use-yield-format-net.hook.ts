import { useAtomValue } from '@effect/atom-react/Hooks';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { roundYieldDifference } from '../utils/round-yield-difference.util';

export const useYieldFormatNet = () => {
    const formatAmount = useProtectedAmountLabel();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (gross: number, tax: number) => ({
        net: formatAmount(roundYieldDifference(gross, tax, decimalPlaces), symbol),
        tax: formatAmount(tax, symbol)
    });
};
