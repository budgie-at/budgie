import { array, date, number, string } from 'zod';

import { AccountEntitySchema } from '../../account/schema/account-entity.schema';
import { CategoryEntitySchema } from '../../category/schema/category-entity.schema';
import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TagEntitySchema } from '../../tag/schema/tag-entity.schema';
import { TRANSACTION_COMMENT_MAX_LENGTH } from '../constant/transaction-comment-max-length.constant';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../constant/transaction-title-max-length.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionTypeEnumSchema } from './transaction-type-enum.schema';

export const TransactionEntitySchema = BaseEntitySchema.extend({
    type: TransactionTypeEnumSchema,
    title: string().max(TRANSACTION_TITLE_MAX_LENGTH).describe('Title of the transaction.'),
    amount: number().describe('Amount of the transaction.'),
    sourceAccountId: number().positive().describe('Id of the source account associated with the transaction.'),
    destinationAccountId: number().positive().optional().describe('Id of the destination account.'),
    comment: string().max(TRANSACTION_COMMENT_MAX_LENGTH).optional().describe('Comment of the transaction.'),
    operatedAt: date()
        .default(() => new Date())
        .describe('Date of the transaction. Default is current date. Can be changed later.'),

    get [TransactionAssociationEnum.SOURCE_ACCOUNT]() {
        return AccountEntitySchema.describe('Source account associated with the transaction.');
    },
    get [TransactionAssociationEnum.DESTINATION_ACCOUNT]() {
        return AccountEntitySchema.nullable().describe('Destination account of the transaction.');
    },
    get [TransactionAssociationEnum.CATEGORY]() {
        return CategoryEntitySchema.describe('Category of the transaction.');
    },
    get [TransactionAssociationEnum.TAGS]() {
        return array(TagEntitySchema).describe('Tags of the transaction.');
    }
});
