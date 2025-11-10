import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

export const getSignFromEntryType = (type: TransactionEntryTypeEnum): 1 | -1 => (type === TransactionEntryTypeEnum.DEBIT ? 1 : -1);
