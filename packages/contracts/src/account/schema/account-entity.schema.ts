import { array, number, string, enum as zodEnum } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { CurrencyEnumSchema } from '../../generic/schema/currency-enum.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';

export const AccountEntitySchema = BaseEntitySchema.extend({
    type: zodEnum(AccountTypeEnum).describe('Type of the account.'),
    currency: CurrencyEnumSchema.describe('Currency of the account.'),
    balance: number().positive().describe('Current balance of the account.'),
    title: string().max(ACCOUNT_TITLE_MAX_LENGTH).describe('Name of the account.'),

    get [AccountAssociationEnum.TRANSACTIONS]() {
        return array(TransactionEntitySchema).describe('Transactions associated with the account.');
    }
});
