import { t } from '@lingui/core/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly showEmptyState?: boolean;
    readonly onPress?: () => void;
    readonly testID?: string;
}

export const TransactionFeePill = ({ amount, currencySymbol, showEmptyState = false, onPress, testID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const hasFee = isPositiveNumber(amount);

    if (!hasFee && !showEmptyState) {
        return null;
    }

    const formattedAmount = formatDigits(amount, currencySymbol);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;

    return <TransactionMetaPill label={label} onPress={onPress} testID={testID} />;
};
