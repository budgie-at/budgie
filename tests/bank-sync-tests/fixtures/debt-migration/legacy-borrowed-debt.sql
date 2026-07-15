BEGIN;

UPDATE settings
SET default_instrument_id = 2,
    updated_at = 1780358400
WHERE deleted_at IS NULL;

INSERT INTO historical_exchange_rates (
    id,
    created_at,
    updated_at,
    deleted_at,
    source_instrument_id,
    target_instrument_id,
    rate_date,
    rate
)
VALUES (200000, 1780272000, 1780272000, NULL, 1, 2, '2026-06-01', 0.92);

INSERT INTO accounts (
    id,
    created_at,
    updated_at,
    deleted_at,
    icon,
    parent_id,
    "order",
    title,
    type,
    nature,
    debt_type,
    instrument_id,
    external_id,
    contact_id,
    deadline,
    target_balance,
    external_source,
    iban,
    include_in_net_worth,
    is_active,
    title_search
)
VALUES
    (100, 1780358400, 1780358400, NULL, 'Wallet', NULL, 0, 'UAH cash', 'CASH', 'ASSET', 'LENT', 33, NULL, NULL, NULL, 0, NULL, NULL, 1, 1, 'uah cash'),
    (101, 1780358400, 1780358400, NULL, 'HandCoins', NULL, 1, 'USD borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, NULL, NULL, NULL, 45000000000, NULL, NULL, 0, 1, 'usd borrowed debt'),
    (102, 1780358400, 1780358400, NULL, 'HandCoins', NULL, 2, 'Ambiguous borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, NULL, NULL, NULL, 10000000000, NULL, NULL, 0, 1, 'ambiguous borrowed debt');

INSERT INTO account_balances (id, created_at, updated_at, deleted_at, account_id, amount)
VALUES (100, 1780358400, 1780358400, NULL, 102, -1000000000);

INSERT INTO transactions (
    id,
    created_at,
    updated_at,
    deleted_at,
    type,
    title,
    external_id,
    operated_at,
    comment,
    to_account_id,
    from_account_id,
    exchange_rate,
    external_source,
    needs_embedding,
    consolidation_parent_transaction_id,
    consolidation_type,
    updated_by
)
VALUES
    (1000, 1780358400, 1780358400, NULL, 'ADJUSTMENT', 'Legacy covered amount', NULL, 1780358400, '', 101, NULL, 1, NULL, 0, NULL, NULL, NULL),
    (1001, 1780444800, 1780444800, NULL, 'DEBT', 'USD debt repayment 1', NULL, 1780444800, '', 100, 101, 1, NULL, 0, NULL, NULL, NULL),
    (1002, 1780531200, 1780531200, NULL, 'DEBT', 'USD debt repayment 2', NULL, 1780531200, '', 100, 101, 1, NULL, 0, NULL, NULL, NULL),
    (1003, 1780617600, 1780617600, NULL, 'DEBT', 'USD debt repayment 3', NULL, 1780617600, '', 100, 101, 1, NULL, 0, NULL, NULL, NULL),
    (1004, 1780704000, 1780704000, NULL, 'DEBT', 'USD debt repayment 4', NULL, 1780704000, '', 100, 101, 1, NULL, 0, NULL, NULL, NULL),
    (1005, 1780790400, 1780790400, NULL, 'DEBT', 'USD debt repayment 5', NULL, 1780790400, '', 100, 101, 1, NULL, 0, NULL, NULL, NULL),
    (1006, 1780876800, 1780876800, NULL, 'DEBT', 'USD debt repayment 6', NULL, 1780876800, '', 100, 101, 1, NULL, 0, NULL, NULL, NULL),
    (1007, 1780963200, 1780963200, NULL, 'DEBT', 'USD debt repayment 7', NULL, 1780963200, '', 101, 100, 1, NULL, 0, NULL, NULL, NULL),
    (1010, 1780358400, 1780358400, NULL, 'ADJUSTMENT', 'Ambiguous borrowed adjustment', NULL, 1780358400, '', 102, NULL, 1, NULL, 0, NULL, NULL, NULL);

INSERT INTO transaction_entries (
    id,
    created_at,
    updated_at,
    deleted_at,
    type,
    account_id,
    category_id,
    transaction_id,
    amount,
    external_id,
    mcc_category_id,
    exchange_rate,
    to_iban,
    original_transaction_id,
    category_source,
    base_instrument_id,
    base_exchange_rate,
    base_amount
)
VALUES
    (2000, 1780358400, 1780358400, NULL, 'DEBIT', 101, NULL, 1000, 4100000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 3772000000),
    (2001, 1780444800, 1780444800, NULL, 'DEBIT', 100, 10, 1001, 29000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 725000000),
    (2002, 1780444800, 1780444800, NULL, 'CREDIT', 101, NULL, 1001, 684000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 629280000),
    (2003, 1780531200, 1780531200, NULL, 'DEBIT', 100, 10, 1002, 28000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 700000000),
    (2004, 1780531200, 1780531200, NULL, 'CREDIT', 101, NULL, 1002, 661000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 608120000),
    (2005, 1780617600, 1780617600, NULL, 'DEBIT', 100, 10, 1003, 25000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 625000000),
    (2006, 1780617600, 1780617600, NULL, 'CREDIT', 101, NULL, 1003, 600000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 552000000),
    (2007, 1780704000, 1780704000, NULL, 'DEBIT', 100, 10, 1004, 24000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 600000000),
    (2008, 1780704000, 1780704000, NULL, 'CREDIT', 101, NULL, 1004, 550000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 506000000),
    (2009, 1780790400, 1780790400, NULL, 'DEBIT', 100, 10, 1005, 23000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 575000000),
    (2010, 1780790400, 1780790400, NULL, 'CREDIT', 101, NULL, 1005, 500000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 460000000),
    (2011, 1780876800, 1780876800, NULL, 'DEBIT', 100, 10, 1006, 22000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 550000000),
    (2012, 1780876800, 1780876800, NULL, 'CREDIT', 101, NULL, 1006, 500000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 460000000),
    (2014, 1780963200, 1780963200, NULL, 'DEBIT', 100, 10, 1007, 21000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.025, 525000000),
    (2015, 1780963200, 1780963200, NULL, 'CREDIT', 101, NULL, 1007, 471000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 433320000),
    (2016, 1780358400, 1780358400, NULL, 'CREDIT', 102, NULL, 1010, 1000000000, NULL, NULL, 1, NULL, NULL, 'USER', 2, 0.92, 920000000);

COMMIT;
