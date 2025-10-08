import { array, string } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { CategoryAssociationEnum } from '../enum/category-association.enum';

export const CategoryEntitySchema = BaseEntitySchema.extend({
    title: string().describe('Title of the category.'),

    get [CategoryAssociationEnum.TRANSACTIONS]() {
        return array(TransactionEntitySchema).describe('Transactions associated with the category.');
    }
});
