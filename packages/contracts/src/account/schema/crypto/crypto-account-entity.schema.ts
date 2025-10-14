import { array, literal } from 'zod';

import { HoldingEntitySchema } from '../../../holding/schema/holding-entity.schema';
import { AccountAssociationEnum } from '../../enum/account-association.enum';
import { AccountTypeEnum } from '../../enum/account-type.enum';
import { BaseAccountEntitySchema } from '../base/base-account-entity.schema';

export const CryptoAccountEntitySchema = BaseAccountEntitySchema.extend({
    type: literal(AccountTypeEnum.CRYPTO),

    get [AccountAssociationEnum.HOLDINGS]() {
        return array(HoldingEntitySchema).describe('Holdings associated with the account.');
    }
});
