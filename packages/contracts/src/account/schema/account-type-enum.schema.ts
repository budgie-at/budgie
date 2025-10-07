import { z } from 'zod';

export const AccountTypeEnumSchema = z.enum(['bank', 'crypto', 'cash', 'stocks']);
