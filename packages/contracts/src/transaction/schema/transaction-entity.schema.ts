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
    accountId: number().positive().describe('Id of the account associated with the transaction.'),
    counterpartyAccountId: number().positive().optional().describe('Id of the counterparty account.'),
    comment: string().max(TRANSACTION_COMMENT_MAX_LENGTH).optional().describe('Comment of the transaction.'),
    operationDate: date()
        .default(() => new Date())
        .describe('Date of the transaction. Default is current date. Can be changed later.'),

    get [TransactionAssociationEnum.ACCOUNT]() {
        return AccountEntitySchema.describe('Account associated with the transaction.');
    },
    get [TransactionAssociationEnum.COUNTERPARTY_ACCOUNT]() {
        return AccountEntitySchema.nullable().describe('Counterparty account of the transaction.');
    },
    get [TransactionAssociationEnum.CATEGORIES]() {
        return array(CategoryEntitySchema).describe('Categories of the transaction.');
    },
    get [TransactionAssociationEnum.TAGS]() {
        return array(TagEntitySchema).describe('Tags of the transaction.');
    }
});
