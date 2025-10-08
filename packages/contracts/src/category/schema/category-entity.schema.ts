import { z } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { CategoryAssociationEnum } from '../enum/category-association.enum';

export const CategoryEntitySchema = BaseEntitySchema.extend({
    title: z.string(),

    get [CategoryAssociationEnum.TRANSACTIONS]() {
        return z.array(TransactionEntitySchema);
    }
});
