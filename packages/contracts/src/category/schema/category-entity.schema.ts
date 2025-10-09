import { array, string } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { CATEGORY_TITLE_MAX_LENGTH } from '../constant/category-title-max-length.constant';
import { CategoryAssociationEnum } from '../enum/category-association.enum';

export const CategoryEntitySchema = BaseEntitySchema.extend({
    title: string().max(CATEGORY_TITLE_MAX_LENGTH).describe('Title of the category.'),
    icon: string().describe('Icon of the category.'),

    get [CategoryAssociationEnum.TRANSACTIONS]() {
        return array(TransactionEntitySchema).describe('Transactions associated with the category.');
    }
});
