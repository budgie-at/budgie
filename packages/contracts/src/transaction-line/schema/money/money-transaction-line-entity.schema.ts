import { TransactionLineEntitySchema } from '../transaction-line-entity.schema';

export const MoneyTransactionLineEntitySchema = TransactionLineEntitySchema.omit({
    quantity: true,
    instrumentId: true,
    pricePerUnit: true
}).required();
