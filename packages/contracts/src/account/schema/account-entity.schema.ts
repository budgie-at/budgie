import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { AccountAssociationEnum } from '../enum/account-association.enum';

import { AccountTypeEnumSchema } from './account-type-enum.schema';

export const AccountEntitySchema = BaseEntitySchema.extend({
    type: AccountTypeEnumSchema,

    get [AccountAssociationEnum.TRANSACTIONS]() {
        return TransactionEntitySchema;
    }
});
