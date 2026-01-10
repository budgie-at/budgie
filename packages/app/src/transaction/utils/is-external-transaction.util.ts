import { ExternalSourceEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const isExternalTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    transaction.externalSource !== ExternalSourceEnum.MANUAL;
