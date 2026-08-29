BEGIN;

UPDATE transactions
SET type = 'DEBT',
    from_account_id = 101,
    to_account_id = 100,
    exchange_rate = 1
WHERE id = 1007;

UPDATE transaction_entries
SET type = 'DEBIT',
    kind = 'PRIMARY',
    category_id = 10,
    category_source = 'USER'
WHERE id = 2014;

UPDATE transaction_entries
SET type = 'CREDIT',
    kind = 'PRIMARY',
    category_id = NULL,
    category_source = 'USER'
WHERE id = 2015;

COMMIT;
