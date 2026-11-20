import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { roundYieldNet } from '../utils/round-yield-net.util';

export const useYieldSpokenAmount = () => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const isAmountProtected = useIsAmountProtected();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    return (value: number, tax = 0) =>
        isAmountProtected ? t`hidden amount` : formatAmount(roundYieldNet(value, tax, decimalPlaces), symbol);
};
