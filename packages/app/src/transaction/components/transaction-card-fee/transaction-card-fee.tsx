import { convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionCardSeparator } from '../transaction-card-separator/transaction-card-separator';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardFee = ({ transaction }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();

    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeEntry = feeEntries.at(0);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));

    if (!isPositiveNumber(feeAmount) || !isDefined(feeEntry)) {
        return null;
    }

    const formattedAmount = formatDigits(feeAmount, feeEntry.account.instrument.symbol);

    return (
        <>
            <Text
                className={cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME, 'shrink-0')}
                numberOfLines={1}
                testID={TransactionCardSelector.FeeMetadata(transaction.id)}
            >
                {t`Fee ${formattedAmount}`}
            </Text>
            <TransactionCardSeparator />
        </>
    );
};
