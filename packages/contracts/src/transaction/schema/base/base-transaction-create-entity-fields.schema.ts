import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BaseTransactionCreateEntityFieldsSchema = TransactionEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    comment: true,
    operatedAt: true
});
