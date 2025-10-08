import { enum as zodEnum } from 'zod';

export const AccountTypeEnumSchema = zodEnum(['bank', 'crypto', 'cash', 'stocks']).describe('Type of the account.');
