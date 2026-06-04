import { boolean, number } from 'zod';

import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';
import { AccountTypeEnum } from '../enum/account-type.enum';

import { AccountEntitySchema } from './account-entity.schema';

export const CryptoAccountCreateInputSchema = convertToCreateEntitySchema(AccountEntitySchema)
    .omit({
        order: true,
        nature: true,
        debtType: true,
        deadline: true,
        parentId: true,
        contactId: true,
        externalId: true,
        externalSource: true,
        targetBalance: true,
        titleSearch: true,
        iban: true
    })
    .extend({
        type: AccountEntitySchema.shape.type.refine(type => type === AccountTypeEnum.CRYPTO),
        currentBalance: number().nonnegative(),
        includeInNetWorth: boolean().optional(),
        isActive: boolean().optional()
    });
