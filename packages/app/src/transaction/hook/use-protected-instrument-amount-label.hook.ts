import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useFormatInstrumentAmount } from '../../i18n/hook/use-format-instrument-amount.hook';

import type { InstrumentTypeEnum } from '@budgie/contracts';

export const useProtectedInstrumentAmountLabel = () => {
    const isAmountProtected = useIsAmountProtected();
    const formatInstrumentAmount = useFormatInstrumentAmount();

    return (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) =>
        isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatInstrumentAmount(amount, symbol, instrumentType);
};
