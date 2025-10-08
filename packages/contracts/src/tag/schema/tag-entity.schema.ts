import { z } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { TagAssociationEnum } from '../enum/tag-association.enum';

export const TagEntitySchema = BaseEntitySchema.extend({
    title: z.string(),

    get [TagAssociationEnum.TRANSACTIONS]() {
        return z.array(TransactionEntitySchema);
    }
});
