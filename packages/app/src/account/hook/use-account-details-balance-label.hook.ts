import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { useFormatInstrumentAmount } from '../../i18n/hook/use-format-instrument-amount.hook';
import { getInstrumentUnitLabel } from '../../instrument/utils/get-instrument-unit-label.util';
import { isSecurityInstrumentType } from '../../instrument/utils/is-security-instrument-type.util';
import { isCryptoAccountType } from '../utils/is-crypto-account-type.util';

export const useAccountDetailsBalanceLabel = () => {
    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useDisplayFormatDigits();
    const formatInstrumentAmount = useFormatInstrumentAmount();

    return (balance: number, account: Pick<AccountWithInstrumentEntityInterface, 'type' | AccountAssociationEnum.INSTRUMENT>): string => {
        if (isAmountProtected) {
            return PROTECTED_AMOUNT_PLACEHOLDER;
        }

        return isCryptoAccountType(account.type) || isSecurityInstrumentType(account.instrument.type)
            ? formatInstrumentAmount(balance, getInstrumentUnitLabel(account.instrument), account.instrument.type)
            : formatDigits(balance, account.instrument.symbol);
    };
};
