import { enum as zodEnum } from 'zod';

import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const TransactionTypeEnumSchema = zodEnum(TransactionTypeEnum).describe('Type of the transaction.');
