-- Composes every seedable Budgie feature into one English marketing dataset for social-media screenshots.

.read shared/long-history.sql
.read shared/multi-currency.sql
.read shared/deposit.sql
.read shared/crypto.sql
.read shared/debt.sql
.read shared/bank-sync-connected.sql
.read shared/binance-sync-connected.sql
.read shared/tags-rich.sql
.read shared/rules.sql
.read shared/transfer-pair.sql
.read shared/bank-fees.sql
.read shared/refund.sql

CREATE TEMP TABLE overlay_scale AS
SELECT CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale
FROM settings;

UPDATE transactions
SET title = CASE id
    WHEN 9001 THEN 'Whole Foods Market'
    WHEN 9002 THEN 'Blue Bottle Coffee'
    WHEN 9003 THEN 'Uber'
    WHEN 9004 THEN 'Shell Station'
    WHEN 9005 THEN 'CVS Pharmacy'
    WHEN 9006 THEN 'AMC Theatres'
    WHEN 9007 THEN 'Nike Store'
    ELSE title
END
WHERE id BETWEEN 9001 AND 9007;

UPDATE accounts
SET
    target_balance = CAST(20000000000 * (SELECT amount_scale FROM overlay_scale) AS INTEGER),
    deadline = unixepoch('now') + 196 * 86400
WHERE id = 3;

UPDATE budgets
SET
    overall_limit = CAST(CASE id WHEN 1 THEN 7700000000 ELSE 10200000000 END * (SELECT amount_scale FROM overlay_scale) AS INTEGER),
    other_limit = CAST(CASE id WHEN 1 THEN 4390000000 ELSE 8820000000 END * (SELECT amount_scale FROM overlay_scale) AS INTEGER)
WHERE id IN (1, 2);

UPDATE budget_category_limits
SET limit_amount = CAST(CASE id
    WHEN 1 THEN 1850000000
    WHEN 2 THEN 1050000000
    WHEN 3 THEN 210000000
    WHEN 4 THEN 200000000
    WHEN 5 THEN 480000000
    WHEN 6 THEN 440000000
    WHEN 7 THEN 115000000
    ELSE 345000000
END * (SELECT amount_scale FROM overlay_scale) AS INTEGER)
WHERE id BETWEEN 1 AND 8;

CREATE TEMP TABLE overlay_target (account_id INTEGER, balance INTEGER);

INSERT INTO overlay_target (account_id, balance) VALUES
    (1, 8420000000),
    (2, 245000000),
    (3, 13850000000),
    (4, -640000000);

CREATE TEMP TABLE overlay_anchor AS
SELECT
    account_balances.account_id AS account_id,
    CAST(overlay_target.balance * (SELECT amount_scale FROM overlay_scale) AS INTEGER)
        - COALESCE((
            SELECT SUM(CASE
                WHEN transaction_entries.type = 'CREDIT' THEN -transaction_entries.amount
                WHEN transaction_entries.type = 'FEE' THEN -transaction_entries.amount
                WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
                ELSE 0
            END)
            FROM transaction_entries
            INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
            WHERE transaction_entries.account_id = account_balances.account_id
              AND transaction_entries.deleted_at IS NULL
              AND transactions.deleted_at IS NULL
              AND transactions.consolidation_parent_transaction_id IS NULL
              AND (transaction_entries.original_transaction_id IS NULL OR transactions.consolidation_type = 'REFUND')
              AND transaction_entries.created_at > account_balances.updated_at
        ), 0) AS amount
FROM account_balances
INNER JOIN overlay_target ON overlay_target.account_id = account_balances.account_id;

UPDATE account_balances
SET amount = (SELECT overlay_anchor.amount FROM overlay_anchor WHERE overlay_anchor.account_id = account_balances.account_id)
WHERE account_balances.account_id IN (SELECT overlay_anchor.account_id FROM overlay_anchor);

DROP TABLE overlay_anchor;

DROP TABLE overlay_target;

DROP TABLE overlay_scale;

.read shared/net-worth-full.sql
