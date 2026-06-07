import { InstrumentTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly showEmptyState?: boolean;
    readonly onPress?: () => void;
    readonly testID?: string;
}

export const TransactionFeePill = ({ amount, currencySymbol, instrumentType, showEmptyState = false, onPress, testID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);
    const hasFee = isPositiveNumber(amount);

    if (!hasFee && !showEmptyState) {
        return null;
    }

    const isCrypto = instrumentType === InstrumentTypeEnum.CRYPTO;
    const formattedAmount = isCrypto ? `${formatCryptoDigits(amount)} ${currencySymbol}` : formatDigits(amount, currencySymbol);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;

    return <TransactionMetaPill label={label} onPress={onPress} testID={testID} />;
};
