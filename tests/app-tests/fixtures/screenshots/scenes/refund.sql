-- Scene overlay: refund pairs, one still loose and one already consolidated.
--
-- Same two states as transfer-pair.sql, for the refund flow:
--
--   * `convert-to-refund-1` needs an UNconsolidated purchase plus a later
--     credit from the same merchant on the same account, so the picker has a
--     candidate to attach the refund to.
--   * `transfer-pair-detection-2` opens `budgie://consolidation-source`, which
--     lists the sources of an ALREADY consolidated transaction, so a second
--     purchase/refund pair is consolidated under a canonical transaction with
--     `consolidation_type = 'REFUND'`.
--
-- The refund is deliberately smaller than the purchase (a partial return), which
-- is the more interesting of the two shapes to screenshot.
--
-- Owns transactions 2000-2099.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

UPDATE transactions SET consolidation_parent_transaction_id = NULL WHERE consolidation_parent_transaction_id BETWEEN 2000 AND 2099;
DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2000 AND 2099;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2000 AND 2099;
DELETE FROM transactions WHERE id BETWEEN 2000 AND 2099;

CREATE TEMP TABLE overlay_amount AS
SELECT
    CAST(ROUND(214900000 * amount_scale / rounding_unit) * rounding_unit AS INTEGER) AS purchase_amount,
    CAST(ROUND(89500000 * amount_scale / rounding_unit) * rounding_unit AS INTEGER) AS refund_amount,
    CAST(ROUND(129900000 * amount_scale / rounding_unit) * rounding_unit AS INTEGER) AS settled_amount
FROM overlay_locale;

CREATE TEMP TABLE overlay_merchant AS
SELECT
    CASE language
        WHEN 'fr' THEN 'Zalando'
        WHEN 'de' THEN 'Zalando'
        WHEN 'es' THEN 'Zara Home'
        WHEN 'uk' THEN 'Intertop'
        ELSE 'Nordstrom'
    END AS store,
    CASE language
        WHEN 'fr' THEN 'Remboursement Zalando'
        WHEN 'de' THEN 'Rückerstattung Zalando'
        WHEN 'es' THEN 'Devolución Zara Home'
        WHEN 'uk' THEN 'Повернення Intertop'
        ELSE 'Nordstrom Refund'
    END AS refund_title
FROM overlay_locale;

-- Loose pair: purchase 4 days ago, partial refund yesterday, neither linked.
INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    2000,
    unixepoch(date('now')) - 4 * 86400 + 1090 * 60,
    unixepoch(date('now')) - 4 * 86400 + 1090 * 60,
    'EXPENSE',
    overlay_merchant.store,
    unixepoch(date('now')) - 4 * 86400 + 1090 * 60,
    '',
    1,
    NULL,
    1.0,
    0
FROM overlay_merchant
UNION ALL
SELECT
    2001,
    unixepoch(date('now')) - 86400 + 640 * 60,
    unixepoch(date('now')) - 86400 + 640 * 60,
    'INCOME',
    overlay_merchant.refund_title,
    unixepoch(date('now')) - 86400 + 640 * 60,
    '',
    NULL,
    1,
    1.0,
    0
FROM overlay_merchant;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 20000, unixepoch(date('now')) - 4 * 86400 + 1090 * 60, unixepoch(date('now')) - 4 * 86400 + 1090 * 60, 'CREDIT', 1, 37, 2000, purchase_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 20010, unixepoch(date('now')) - 86400 + 640 * 60, unixepoch(date('now')) - 86400 + 640 * 60, 'DEBIT', 1, 37, 2001, refund_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount;

-- Consolidated pair: canonical 2010 with sources 2011 (purchase) and 2012
-- (refund), which is what the consolidation-source sheet lists.
INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, consolidation_type, needs_embedding)
SELECT
    2010,
    unixepoch(date('now')) - 11 * 86400 + 940 * 60,
    unixepoch(date('now')) - 11 * 86400 + 940 * 60,
    'EXPENSE',
    overlay_merchant.store,
    unixepoch(date('now')) - 11 * 86400 + 940 * 60,
    '',
    1,
    NULL,
    1.0,
    'REFUND',
    0
FROM overlay_merchant;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, consolidation_parent_transaction_id, needs_embedding)
SELECT
    2011,
    unixepoch(date('now')) - 11 * 86400 + 940 * 60,
    unixepoch(date('now')) - 11 * 86400 + 940 * 60,
    'EXPENSE',
    overlay_merchant.store,
    unixepoch(date('now')) - 11 * 86400 + 940 * 60,
    '',
    1,
    NULL,
    1.0,
    2010,
    0
FROM overlay_merchant
UNION ALL
SELECT
    2012,
    unixepoch(date('now')) - 8 * 86400 + 705 * 60,
    unixepoch(date('now')) - 8 * 86400 + 705 * 60,
    'INCOME',
    overlay_merchant.refund_title,
    unixepoch(date('now')) - 8 * 86400 + 705 * 60,
    '',
    NULL,
    1,
    1.0,
    2010,
    0
FROM overlay_merchant;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 20100, unixepoch(date('now')) - 11 * 86400 + 940 * 60, unixepoch(date('now')) - 11 * 86400 + 940 * 60, 'CREDIT', 1, 22, 2010, settled_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 20110, unixepoch(date('now')) - 11 * 86400 + 940 * 60, unixepoch(date('now')) - 11 * 86400 + 940 * 60, 'CREDIT', 1, 22, 2011, purchase_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 20120, unixepoch(date('now')) - 8 * 86400 + 705 * 60, unixepoch(date('now')) - 8 * 86400 + 705 * 60, 'DEBIT', 1, 22, 2012, refund_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount;

DROP TABLE overlay_merchant;
DROP TABLE overlay_amount;
DROP TABLE overlay_locale;
