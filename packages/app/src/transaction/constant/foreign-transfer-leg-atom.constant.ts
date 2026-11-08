import { TransactionRepository, TransactionEntityTable, SyncRecordEntityTable } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const foreignTransferLegAtom = databaseQueryFamily(
    [TransactionEntityTable, SyncRecordEntityTable],
    TransactionRepository,
    (repository, transactionId: number) => repository.isForeignTransferLeg(transactionId)
);
