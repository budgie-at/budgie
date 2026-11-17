import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

export const useYieldSpokenAmount = () => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const isAmountProtected = useIsAmountProtected();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (value: number) => (isAmountProtected ? t`hidden amount` : formatAmount(value, symbol));
};
