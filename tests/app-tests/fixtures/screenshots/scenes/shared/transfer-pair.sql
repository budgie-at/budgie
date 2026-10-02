-- Adds a loose transfer pair and an already-consolidated transfer pair.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

UPDATE transactions SET consolidation_parent_transaction_id = NULL WHERE consolidation_parent_transaction_id BETWEEN 2100 AND 2199;
DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2100 AND 2199;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2100 AND 2199;
DELETE FROM transactions WHERE id BETWEEN 2100 AND 2199;

CREATE TEMP TABLE overlay_amount AS
SELECT
    CAST(ROUND(320000000 * amount_scale / rounding_unit) * rounding_unit AS INTEGER) AS loose_amount,
    CAST(ROUND(750000000 * amount_scale / rounding_unit) * rounding_unit AS INTEGER) AS paired_amount
FROM overlay_locale;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    2100,
    unixepoch(date('now')) - 86400 + 620 * 60,
    unixepoch(date('now')) - 86400 + 620 * 60,
    'EXPENSE',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Virement sortant'
        WHEN 'de' THEN 'Überweisung ausgehend'
        WHEN 'es' THEN 'Transferencia enviada'
        WHEN 'uk' THEN 'Переказ на іншу картку'
        ELSE 'Outgoing Transfer'
    END,
    unixepoch(date('now')) - 86400 + 620 * 60,
    '',
    1,
    NULL,
    1.0,
    0
FROM overlay_locale
UNION ALL
SELECT
    2101,
    unixepoch(date('now')) - 86400 + 800 * 60,
    unixepoch(date('now')) - 86400 + 800 * 60,
    'INCOME',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Virement entrant'
        WHEN 'de' THEN 'Überweisung eingehend'
        WHEN 'es' THEN 'Transferencia recibida'
        WHEN 'uk' THEN 'Зарахування переказу'
        ELSE 'Incoming Transfer'
    END,
    unixepoch(date('now')) - 86400 + 800 * 60,
    '',
    NULL,
    3,
    1.0,
    0
FROM overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 21000, unixepoch(date('now')) - 86400 + 620 * 60, unixepoch(date('now')) - 86400 + 620 * 60, 'CREDIT', 1, 38, 2100, loose_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 21010, unixepoch(date('now')) - 86400 + 800 * 60, unixepoch(date('now')) - 86400 + 800 * 60, 'DEBIT',  3, 38, 2101, loose_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, consolidation_type, needs_embedding)
SELECT
    2110,
    unixepoch(date('now')) - 5 * 86400 + 700 * 60,
    unixepoch(date('now')) - 5 * 86400 + 700 * 60,
    'TRANSFER',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Vers l''épargne de précaution'
        WHEN 'de' THEN 'Zum Notgroschen'
        WHEN 'es' THEN 'Al fondo de emergencia'
        WHEN 'uk' THEN 'На резервний фонд'
        ELSE 'To Emergency Savings'
    END,
    unixepoch(date('now')) - 5 * 86400 + 700 * 60,
    '',
    1,
    3,
    1.0,
    'TRANSFER_PAIR',
    0
FROM overlay_locale;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, consolidation_parent_transaction_id, needs_embedding)
SELECT
    2111,
    unixepoch(date('now')) - 5 * 86400 + 700 * 60,
    unixepoch(date('now')) - 5 * 86400 + 700 * 60,
    'EXPENSE',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Virement sortant'
        WHEN 'de' THEN 'Überweisung ausgehend'
        WHEN 'es' THEN 'Transferencia enviada'
        WHEN 'uk' THEN 'Переказ на іншу картку'
        ELSE 'Outgoing Transfer'
    END,
    unixepoch(date('now')) - 5 * 86400 + 700 * 60,
    '',
    1,
    NULL,
    1.0,
    2110,
    0
FROM overlay_locale
UNION ALL
SELECT
    2112,
    unixepoch(date('now')) - 5 * 86400 + 760 * 60,
    unixepoch(date('now')) - 5 * 86400 + 760 * 60,
    'INCOME',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Virement entrant'
        WHEN 'de' THEN 'Überweisung eingehend'
        WHEN 'es' THEN 'Transferencia recibida'
        WHEN 'uk' THEN 'Зарахування переказу'
        ELSE 'Incoming Transfer'
    END,
    unixepoch(date('now')) - 5 * 86400 + 760 * 60,
    '',
    NULL,
    3,
    1.0,
    2110,
    0
FROM overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 21100, unixepoch(date('now')) - 5 * 86400 + 700 * 60, unixepoch(date('now')) - 5 * 86400 + 700 * 60, 'CREDIT', 1, NULL, 2110, paired_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 21101, unixepoch(date('now')) - 5 * 86400 + 700 * 60, unixepoch(date('now')) - 5 * 86400 + 700 * 60, 'DEBIT',  3, NULL, 2110, paired_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 21110, unixepoch(date('now')) - 5 * 86400 + 700 * 60, unixepoch(date('now')) - 5 * 86400 + 700 * 60, 'CREDIT', 1, 38,   2111, paired_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount
UNION ALL
SELECT 21120, unixepoch(date('now')) - 5 * 86400 + 760 * 60, unixepoch(date('now')) - 5 * 86400 + 760 * 60, 'DEBIT',  3, 38,   2112, paired_amount, 1.0, 'USER', 'PRIMARY' FROM overlay_amount;

DROP TABLE overlay_amount;
DROP TABLE overlay_locale;
