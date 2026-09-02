-- Scene overlay: a backlog of uncategorised transactions.
--
-- "Uncategorised" is `transaction_entries.category_id IS NULL` on a PRIMARY
-- entry, which is what the missing-category pill counts and what the cleanup
-- flow works through.
--
-- Nine rows spread over the last week, mixed across accounts, so the pill shows
-- a believable count and the list has enough rows for a scroll.
--
-- Owns transactions 1600-1699.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1600 AND 1699;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1600 AND 1699;
DELETE FROM transactions WHERE id BETWEEN 1600 AND 1699;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, account_id, days_ago, minute, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (1600, 1, 0, 1140, 42800000, 'SQ *MARKET STALL',   'SUM UP *MARCHÉ',      'SUMUP *MARKTSTAND',   'SUMUP *PUESTO',       'SQ *ЯРМАРОК'),
    (1601, 1, 0,  835, 18950000, 'PAYPAL *R2ND4K',     'PAYPAL *R2ND4K',      'PAYPAL *R2ND4K',      'PAYPAL *R2ND4K',      'PAYPAL *R2ND4K'),
    (1602, 2, 1,  610,  9200000, 'KIOSK 118',          'KIOSQUE 118',         'KIOSK 118',           'QUIOSCO 118',         'КІОСК 118'),
    (1603, 1, 1, 1210, 71500000, 'IZ *STUDIO 42',      'IZ *STUDIO 42',       'IZ *STUDIO 42',       'IZ *STUDIO 42',       'IZ *СТУДІЯ 42'),
    (1604, 4, 2,  920, 25600000, 'WWW.TICKETS-ONLINE', 'WWW.BILLETS-ENLIGNE', 'WWW.TICKETS-ONLINE',  'WWW.ENTRADAS-ONLINE', 'WWW.KVYTKY-ONLINE'),
    (1605, 1, 3,  705, 133400000, 'AMZ Mktp EU*7K2LQ', 'AMZ Mktp EU*7K2LQ',   'AMZ Mktp EU*7K2LQ',   'AMZ Mktp EU*7K2LQ',   'AMZ Mktp EU*7K2LQ'),
    (1606, 2, 4, 1035, 15750000, 'BAKERY NO. 7',       'BOULANGERIE N° 7',    'BÄCKEREI NR. 7',      'PANADERÍA N.º 7',     'ПЕКАРНЯ № 7'),
    (1607, 1, 5,  880, 58900000, 'STRIPE *DESKWORKS',  'STRIPE *DESKWORKS',   'STRIPE *DESKWORKS',   'STRIPE *DESKWORKS',   'STRIPE *DESKWORKS'),
    (1608, 4, 6, 1160, 47300000, 'POS 6612 TERMINAL',  'TPE 6612',            'POS 6612 TERMINAL',   'TPV 6612',            'POS 6612 ТЕРМІНАЛ');

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'EXPENSE',
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_transaction.title_fr
        WHEN 'de' THEN overlay_transaction.title_de
        WHEN 'es' THEN overlay_transaction.title_es
        WHEN 'uk' THEN overlay_transaction.title_uk
        ELSE overlay_transaction.title_en
    END,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    overlay_transaction.account_id,
    NULL,
    1.0,
    1
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    overlay_transaction.account_id,
    NULL,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

DROP TABLE overlay_transaction;
DROP TABLE overlay_locale;
