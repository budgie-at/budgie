import { z } from 'zod';

import { CategoryAssociationEnum } from '@/category';
import { BaseEntitySchema } from '@/generic';
import { TransactionEntitySchema } from '@/transaction';

export const CategoryEntitySchema = BaseEntitySchema.extend({
    title: z.string(),

    get [CategoryAssociationEnum.TRANSACTIONS]() {
        return z.array(TransactionEntitySchema);
    }
});
