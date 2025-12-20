import {
    ExpenseTransactionCreateEntitySchema,
    IncomeTransactionCreateEntitySchema,
    TransactionCreateEntitySchema,
    TransactionEntryCreateEntitySchema,
    TransferTransactionCreateEntitySchema
} from '@budgie/contracts';
import { array, infer, number } from 'zod';

export const TransactionEntryCreateInputSchema = TransactionEntryCreateEntitySchema.omit({
    amount: true,
    transactionId: true
}).extend({
    amount: number().positive()
});

export const TransactionCreateInputSchema = TransactionCreateEntitySchema.omit({ amount: true, exchangeRate: true }).extend({
    amount: number(),
    tagIds: array(number()),
    exchangeRate: number().positive(),
    entries: array(TransactionEntryCreateInputSchema).min(1)
});

export const ExpenseTransactionCreateInputSchema = ExpenseTransactionCreateEntitySchema.omit({
    amount: true,
    exchangeRate: true
}).extend({
    amount: number(),
    tagIds: array(number()),
    exchangeRate: number().positive(),
    entries: array(TransactionEntryCreateInputSchema).min(1)
});

export const IncomeTransactionCreateInputSchema = IncomeTransactionCreateEntitySchema.omit({
    amount: true,
    exchangeRate: true
}).extend({
    amount: number(),
    tagIds: array(number()),
    exchangeRate: number().positive(),
    entries: array(TransactionEntryCreateInputSchema).min(1)
});

export const TransferTransactionCreateInputSchema = TransferTransactionCreateEntitySchema.omit({
    amount: true,
    exchangeRate: true
}).extend({
    amount: number(),
    tagIds: array(number()),
    exchangeRate: number().positive(),
    entries: array(TransactionEntryCreateInputSchema).min(2)
});

export interface TransactionCreateInputInterface extends infer<typeof TransactionCreateInputSchema> {}
export interface TransactionEntryCreateInputInterface extends infer<typeof TransactionEntryCreateInputSchema> {}
