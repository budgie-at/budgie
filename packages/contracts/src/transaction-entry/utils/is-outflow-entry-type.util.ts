import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

export const isOutflowEntryType = (type: TransactionEntryTypeEnum): boolean =>
    type === TransactionEntryTypeEnum.CREDIT || type === TransactionEntryTypeEnum.FEE;
