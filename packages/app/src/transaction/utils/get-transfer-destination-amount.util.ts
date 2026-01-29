import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

export const getTransferDestinationAmount = (
    entries: TransactionEntryCreateInputInterface[],
    toAccountId: number | null
): number | undefined => {
    if (!isPositiveNumber(toAccountId)) {
        return void 0;
    }

    const destinationEntry = entries.find(entry => entry.accountId === toAccountId && entry.type === TransactionEntryTypeEnum.DEBIT);

    return destinationEntry?.amount;
};
