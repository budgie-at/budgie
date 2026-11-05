import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

import { TransactionFeeFieldIconSelector } from './transaction-fee-field-icon.selector';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly onPress: () => void;
}

export const TransactionFeeFieldIcon = ({ amount, currencySymbol, instrumentType, onPress }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const hasFee = isPositiveNumber(amount);

    const protectedAmount = isAmountProtected
        ? PROTECTED_AMOUNT_PLACEHOLDER
        : formatInstrumentAmount(amount, currencySymbol, instrumentType ?? null);
    const value = hasFee ? protectedAmount : void 0;

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.Receipt}
            label={t`Fee`}
            value={value}
            placeholder={t`Add`}
            onPress={onPress}
            testID={TransactionFeeFieldIconSelector.Row}
        />
    );
};
