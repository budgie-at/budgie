import { TransactionAssociationEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatInstrumentAmount } from '../../i18n/hook/use-format-instrument-amount.hook';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionFeeLabel = (
    transaction: Pick<TransactionWithRelationsEntityInterface, TransactionAssociationEnum.ENTRIES>
): string | null => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeInstrument = feeEntries.at(0)?.account.instrument;

    if (!isPositiveNumber(feeAmount) || !isDefined(feeInstrument)) {
        return null;
    }

    const formattedAmount = formatInstrumentAmount(feeAmount, feeInstrument.symbol, feeInstrument.type);

    return t`Fee ${formattedAmount}`;
};
