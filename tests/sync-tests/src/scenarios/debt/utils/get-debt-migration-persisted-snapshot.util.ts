import type { DebtMigrationPersistedSnapshotInterface } from '../interface/debt-migration-persisted-snapshot.interface';
import type {
    AccountBalanceEntityInterface,
    AccountEntityInterface,
    DB,
    DebtEventEntityInterface,
    TransactionEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

export const getDebtMigrationPersistedSnapshot = async (db: DB, accountId: number): Promise<DebtMigrationPersistedSnapshotInterface> => {
    const accounts = await db.$client.getAllAsync<
        Pick<
            AccountEntityInterface,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'deletedAt'
            | 'type'
            | 'debtType'
            | 'instrumentId'
            | 'targetBalance'
            | 'targetBaseInstrumentId'
            | 'targetBaseExchangeRate'
            | 'targetBaseAmount'
        >
    >(
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, type, debt_type AS debtType, instrument_id AS instrumentId, target_balance AS targetBalance, target_base_instrument_id AS targetBaseInstrumentId, target_base_exchange_rate AS targetBaseExchangeRate, target_base_amount AS targetBaseAmount FROM accounts WHERE id = ? ORDER BY id',
        [accountId]
    );
    const balances = await db.$client.getAllAsync<
        Pick<AccountBalanceEntityInterface, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'accountId' | 'amount'>
    >(
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, account_id AS accountId, amount FROM account_balances WHERE account_id = ? ORDER BY id',
        [accountId]
    );
    const transactions = await db.$client.getAllAsync<
        Pick<
            TransactionEntityInterface,
            'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'type' | 'operatedAt' | 'toAccountId' | 'fromAccountId' | 'exchangeRate'
        >
    >(
        'SELECT DISTINCT transactions.id, transactions.created_at AS createdAt, transactions.updated_at AS updatedAt, transactions.deleted_at AS deletedAt, transactions.type, transactions.operated_at AS operatedAt, transactions.to_account_id AS toAccountId, transactions.from_account_id AS fromAccountId, transactions.exchange_rate AS exchangeRate FROM transactions LEFT JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id WHERE transactions.from_account_id = ? OR transactions.to_account_id = ? OR transaction_entries.account_id = ? ORDER BY transactions.id',
        [accountId, accountId, accountId]
    );
    const transactionEntries = await db.$client.getAllAsync<
        Pick<
            TransactionEntryEntityInterface,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'deletedAt'
            | 'type'
            | 'accountId'
            | 'categoryId'
            | 'transactionId'
            | 'amount'
            | 'kind'
            | 'categorySource'
            | 'baseInstrumentId'
            | 'baseExchangeRate'
            | 'baseAmount'
            | 'originalTransactionId'
        >
    >(
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, type, account_id AS accountId, category_id AS categoryId, transaction_id AS transactionId, amount, kind, category_source AS categorySource, base_instrument_id AS baseInstrumentId, base_exchange_rate AS baseExchangeRate, base_amount AS baseAmount, original_transaction_id AS originalTransactionId FROM transaction_entries WHERE transaction_id IN (SELECT transactions.id FROM transactions WHERE transactions.from_account_id = ? OR transactions.to_account_id = ? OR EXISTS (SELECT 1 FROM transaction_entries account_entry WHERE account_entry.transaction_id = transactions.id AND account_entry.account_id = ?)) ORDER BY id',
        [accountId, accountId, accountId]
    );
    const debtEvents = await db.$client.getAllAsync<
        Pick<
            DebtEventEntityInterface,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'deletedAt'
            | 'debtAccountId'
            | 'transactionId'
            | 'transactionEntryId'
            | 'direction'
            | 'source'
            | 'amount'
            | 'baseInstrumentId'
            | 'baseExchangeRate'
            | 'baseAmount'
            | 'operatedAt'
        >
    >(
        'SELECT id, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt, debt_account_id AS debtAccountId, transaction_id AS transactionId, transaction_entry_id AS transactionEntryId, direction, source, amount, base_instrument_id AS baseInstrumentId, base_exchange_rate AS baseExchangeRate, base_amount AS baseAmount, operated_at AS operatedAt FROM debt_events WHERE debt_account_id = ? ORDER BY id',
        [accountId]
    );

    return { accounts, balances, transactions, transactionEntries, debtEvents };
};
