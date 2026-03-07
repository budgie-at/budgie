import { boolean, number } from 'zod';

import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { AccountEntitySchema } from './account-entity.schema';

export const DebtAccountCreateInputSchema = convertToCreateEntitySchema(AccountEntitySchema)
    .omit({
        order: true,
        nature: true,
        parentId: true,
        externalId: true,
        targetBalance: true,
        externalSource: true,
        titleSearch: true
    })
    .required({
        contactId: true,
        deadline: true
    })
    .extend({
        targetBalance: number().positive(),
        currentBalance: number().nonnegative(),
        includeInNetWorth: boolean().optional(),
        isActive: boolean().optional()
    });
