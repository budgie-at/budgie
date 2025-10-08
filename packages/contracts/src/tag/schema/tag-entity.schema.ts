import { array, string } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { TagAssociationEnum } from '../enum/tag-association.enum';

export const TagEntitySchema = BaseEntitySchema.extend({
    title: string().describe('Title of the tag.'),

    get [TagAssociationEnum.TRANSACTIONS]() {
        return array(TransactionEntitySchema).describe('Transactions associated with the tag.');
    }
});
