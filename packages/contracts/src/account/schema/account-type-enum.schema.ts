import { enum as zodEnum } from 'zod';

import { AccountTypeEnum } from '../enum/account-type.enum';

export const AccountTypeEnumSchema = zodEnum(AccountTypeEnum).describe('Type of the account.');
