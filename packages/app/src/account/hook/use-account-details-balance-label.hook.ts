import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { useFormatInstrumentAmount } from '../../i18n/hook/use-format-instrument-amount.hook';
import { isCryptoAccountType } from '../utils/is-crypto-account-type.util';

export const useAccountDetailsBalanceLabel = () => {
    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useDisplayFormatDigits();
    const formatInstrumentAmount = useFormatInstrumentAmount();

    return (balance: number, account: Pick<AccountWithInstrumentEntityInterface, 'type' | AccountAssociationEnum.INSTRUMENT>): string => {
        if (isAmountProtected) {
            return PROTECTED_AMOUNT_PLACEHOLDER;
        }

        return isCryptoAccountType(account.type) || account.instrument.type === InstrumentTypeEnum.FUND
            ? formatInstrumentAmount(balance, account.instrument.code, account.instrument.type)
            : formatDigits(balance, account.instrument.symbol);
    };
};
