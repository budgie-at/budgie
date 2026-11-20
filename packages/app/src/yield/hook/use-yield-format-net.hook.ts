import { useAtomValue } from '@effect/atom-react/Hooks';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { roundYieldNet } from '../utils/round-yield-net.util';

export const useYieldFormatNet = () => {
    const formatAmount = useProtectedAmountLabel();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (gross: number, tax: number) => ({
        net: formatAmount(roundYieldNet(gross, tax, decimalPlaces), symbol),
        tax: formatAmount(tax, symbol)
    });
};
