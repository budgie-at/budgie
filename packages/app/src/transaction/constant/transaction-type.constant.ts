import { TransactionTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const TRANSACTION_TYPE: Record<TransactionTypeEnum, MessageDescriptor> = {
    [TransactionTypeEnum.TRANSFER]: msg`Transfer`,
    [TransactionTypeEnum.INCOME]: msg`Income`,
    [TransactionTypeEnum.DEBT]: msg`Debt`,
    [TransactionTypeEnum.EXPENSE]: msg`Expense`,
    [TransactionTypeEnum.ADJUSTMENT]: msg`Adjustment`,
};
