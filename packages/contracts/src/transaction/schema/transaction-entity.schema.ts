import { z } from 'zod';

import { AccountEntitySchema } from '@/account';
import { BaseEntitySchema } from '@/generic';
import { TagEntitySchema } from '@/tag';
import { TransactionAssociationEnum, TransactionTypeEnumSchema } from '@/transaction';

export const TransactionEntitySchema = BaseEntitySchema.extend({
    title: z.string(),
    amount: z.number(),
    comment: z.string(),
    accountId: z.number(),
    type: TransactionTypeEnumSchema,
    operationDate: z.date().default(() => new Date()),

    get [TransactionAssociationEnum.ACCOUNT]() {
        return AccountEntitySchema;
    },
    get [TransactionAssociationEnum.CATEGORIES]() {
        return z.array(TagEntitySchema);
    },
    get [TransactionAssociationEnum.TAGS]() {
        return z.array(TagEntitySchema);
    }
});
