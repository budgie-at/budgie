import { AccountAssociationEnum, AccountTypeEnumSchema } from '@/account';
import { BaseEntitySchema } from '@/generic';
import { TransactionEntitySchema } from '@/transaction';

export const AccountEntitySchema = BaseEntitySchema.extend({
    type: AccountTypeEnumSchema,

    get [AccountAssociationEnum.TRANSACTIONS]() {
        return TransactionEntitySchema;
    }
});
