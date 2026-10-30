import { TransactionAssociationEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionFeeLabel = (
    transaction: Pick<TransactionWithRelationsEntityInterface, TransactionAssociationEnum.ENTRIES>
): string | null => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();

    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeSymbol = feeEntries.at(0)?.account.instrument.symbol;

    if (!isPositiveNumber(feeAmount) || !isDefined(feeSymbol)) {
        return null;
    }

    const formattedAmount = formatDigits(feeAmount, feeSymbol);

    return t`Fee ${formattedAmount}`;
};
