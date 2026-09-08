-- Adds a card refund income that mirrors the showcase clothing expense it reverses.

CREATE TEMP TABLE overlay_locale AS
SELECT settings.language AS language FROM settings;

CREATE TEMP TABLE overlay_source AS
SELECT
    transactions.operated_at AS operated_at,
    transactions.title AS title,
    transaction_entries.account_id AS account_id,
    transaction_entries.category_id AS category_id,
    transaction_entries.amount AS amount
FROM transactions
INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id
WHERE transactions.id = 157
  AND transactions.deleted_at IS NULL
  AND transaction_entries.type = 'CREDIT'
  AND transaction_entries.deleted_at IS NULL;

UPDATE transactions SET consolidation_parent_transaction_id = NULL WHERE consolidation_parent_transaction_id BETWEEN 2200 AND 2299;
UPDATE transactions SET consolidation_type = NULL WHERE id = 157;
DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2200 AND 2299;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2200 AND 2299;
DELETE FROM transactions WHERE id BETWEEN 2200 AND 2299;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    2200,
    overlay_source.operated_at + 3 * 86400,
    overlay_source.operated_at + 3 * 86400,
    'INCOME',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Remboursement ' || overlay_source.title
        WHEN 'de' THEN 'Erstattung ' || overlay_source.title
        WHEN 'es' THEN 'Reembolso de ' || overlay_source.title
        WHEN 'uk' THEN 'Повернення від ' || overlay_source.title
        ELSE 'Refund from ' || overlay_source.title
    END,
    overlay_source.operated_at + 3 * 86400,
    '',
    NULL,
    overlay_source.account_id,
    1.0,
    0
FROM overlay_source
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    22000,
    overlay_source.operated_at + 3 * 86400,
    overlay_source.operated_at + 3 * 86400,
    'DEBIT',
    overlay_source.account_id,
    overlay_source.category_id,
    2200,
    overlay_source.amount,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_source;

DROP TABLE overlay_source;
DROP TABLE overlay_locale;
