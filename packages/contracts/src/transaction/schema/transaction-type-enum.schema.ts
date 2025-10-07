import z from 'zod';

export const TransactionTypeEnumSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'DEBT']);
