import { string, enum as zodEnum } from 'zod';

import { BaseEntitySchema } from '../../../generic/schema/base-entity.schema';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../../constant/account-title-max-length.constant';
import { AccountTypeEnum } from '../../enum/account-type.enum';

export const BaseAccountEntitySchema = BaseEntitySchema.extend({
    icon: string().describe('Icon of the account.'),
    type: zodEnum(AccountTypeEnum).describe('Type of the account.'),
    title: string().max(ACCOUNT_TITLE_MAX_LENGTH).describe('Name of the account.')
});
