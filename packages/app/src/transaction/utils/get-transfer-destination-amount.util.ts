import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export const getTransferDestinationAmount = (
    entries: TransactionEntryCreateInputInterface[],
    toAccountId: number | null
): number | undefined => entries.find(entry => entry.accountId === toAccountId && entry.type === TransactionEntryTypeEnum.DEBIT)?.amount;
