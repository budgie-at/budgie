import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { TransactionEntitySchema } from './transaction-entity.schema';

export const TransactionCreateEntitySchema = convertToCreateEntitySchema(TransactionEntitySchema).superRefine(({ amount }, context) => {
    if (amount === BigInt(0)) {
        context.addIssue({
            code: 'custom',
            path: ['amount'],
            message: 'Amount must not be equal to 0.'
        });
    }
});
