import { array, date, number, string, enum as zodEnum } from 'zod';

import { BaseAccountEntitySchema } from '../../../account/schema/base/base-account-entity.schema';
import { CategoryEntitySchema } from '../../../category/schema/category-entity.schema';
import { BaseEntitySchema } from '../../../generic/schema/base-entity.schema';
import { TagEntitySchema } from '../../../tag/schema/tag-entity.schema';
import { TransactionLineEntitySchema } from '../../../transaction-line/schema/transaction-line-entity.schema';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../../constant/transaction-title-max-length.constant';
import { TransactionAssociationEnum } from '../../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const BaseTransactionEntitySchema = BaseEntitySchema.extend({
    note: string().nullable().describe('Note of the transaction.'),
    operatedAt: date()
        .default(() => new Date())
        .describe('Date when the transaction was made.'),
    type: zodEnum(TransactionTypeEnum).describe('Type of the transaction.'),
    categoryId: number().describe('Id of the category associated with the transaction.'),
    title: string().max(TRANSACTION_TITLE_MAX_LENGTH).describe('Title of the transaction.'),

    get [TransactionAssociationEnum.CATEGORY]() {
        return CategoryEntitySchema.describe('Category associated with the transaction.');
    },
    get [TransactionAssociationEnum.TAGS]() {
        return array(TagEntitySchema).describe('Tags associated with the transaction.');
    },
    get [TransactionAssociationEnum.SOURCE_ACCOUNT]() {
        return BaseAccountEntitySchema.describe('Source account associated with the transaction.');
    },
    get [TransactionAssociationEnum.LINES]() {
        return array(TransactionLineEntitySchema).min(1).describe('Lines associated with the transaction.');
    }
});
