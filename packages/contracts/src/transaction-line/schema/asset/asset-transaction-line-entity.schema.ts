import { TransactionLineEntitySchema } from '../transaction-line-entity.schema';

export const AssetTransactionLineEntitySchema = TransactionLineEntitySchema.omit({
    amount: true
}).required();
