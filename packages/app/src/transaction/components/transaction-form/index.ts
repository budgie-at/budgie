import { TransactionFormAccounts } from './transaction-form.accounts';
import { TransactionFormAmount } from './transaction-form.amount';
import { TransactionFormCategory } from './transaction-form.category';
import { TransactionFormComment } from './transaction-form.comment';
import { TransactionFormMetadata } from './transaction-form.metadata';
import { TransactionFormRoot } from './transaction-form.root';

export const TransactionForm = {
    Root: TransactionFormRoot,
    Amount: TransactionFormAmount,
    Category: TransactionFormCategory,
    Accounts: TransactionFormAccounts,
    Metadata: TransactionFormMetadata,
    Comment: TransactionFormComment
};
