import { z } from 'zod';

import { AccountEntitySchema } from '../../account/schema/account-entity.schema';
import { CategoryEntitySchema } from '../../category/schema/category-entity.schema';
import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TagEntitySchema } from '../../tag/schema/tag-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionTypeEnumSchema } from './transaction-type-enum.schema';

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
        return z.array(CategoryEntitySchema);
    },
    get [TransactionAssociationEnum.TAGS]() {
        return z.array(TagEntitySchema);
    }
});
