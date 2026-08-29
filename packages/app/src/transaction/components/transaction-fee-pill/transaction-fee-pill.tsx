import { InstrumentTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
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
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const hasFee = isPositiveNumber(amount);

    if (!hasFee && !showEmptyState) {
        return null;
    }

    const formattedAmount = formatInstrumentAmount(amount, currencySymbol, instrumentType ?? null);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;

    return <TransactionMetaPill label={label} onPress={onPress} testID={testID} />;
};
