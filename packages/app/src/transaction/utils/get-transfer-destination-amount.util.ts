import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

export const getTransferDestinationAmount = (
    entries: TransactionEntryCreateInputInterface[],
    toAccountId: number | null,
    sourceAmount: number
): number | undefined => {
    if (!isPositiveNumber(toAccountId)) {
        return void 0;
    }

    const destinationEntry = entries.find(entry => entry.accountId === toAccountId && entry.type === TransactionEntryTypeEnum.DEBIT);

    const destinationAmount = destinationEntry?.amount;

    if (!isPositiveNumber(destinationAmount) || destinationAmount === sourceAmount) {
        return void 0;
    }

    return destinationAmount;
};
