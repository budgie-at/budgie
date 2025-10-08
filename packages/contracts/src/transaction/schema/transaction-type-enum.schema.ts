import { enum as zodEnum } from 'zod';

export const TransactionTypeEnumSchema = zodEnum(['INCOME', 'EXPENSE', 'TRANSFER', 'DEBT']).describe('Type of the transaction.');
