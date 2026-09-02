-- Scene overlay: a tag-heavy month.
--
-- The base dataset has 5 tags on 25 transactions, which is too thin for the
-- Analytics "Tags" tab and for the primary-tag story. This overlay adds 6 more
-- tags, tags a further ~35 existing transactions and inserts a small run of
-- multi-tagged rows so the tag chips wrap on the transaction list.
--
-- `transaction_tags.is_primary` has a UNIQUE partial index per transaction, so
-- every transaction touched here gets exactly one primary tag; secondary tags
-- go in with `is_primary = 0`.
--
-- Owns tags 10-15 and transactions 1700-1799.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1700 AND 1799;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1700 AND 1799;
DELETE FROM transactions WHERE id BETWEEN 1700 AND 1799;
DELETE FROM merchant_embedding_tags WHERE tag_id BETWEEN 10 AND 15;
DELETE FROM comment_embedding_tags WHERE tag_id BETWEEN 10 AND 15;
DELETE FROM transaction_tags WHERE tag_id BETWEEN 10 AND 15;
DELETE FROM tags WHERE id BETWEEN 10 AND 15;

CREATE TEMP TABLE overlay_tag (
    id INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_tag (id, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (10, 'Groceries run', 'Courses',        'Wocheneinkauf',  'Compra semanal',  'Закупи'),
    (11, 'Eating out',    'Restaurant',     'Auswärts essen', 'Comer fuera',     'Кафе'),
    (12, 'Commute',       'Trajet',         'Pendeln',        'Desplazamiento',  'Дорога на роботу'),
    (13, 'Kids',          'Enfants',        'Kinder',         'Niños',           'Діти'),
    (14, 'Home',          'Maison',         'Zuhause',        'Casa',            'Дім'),
    (15, 'Gifts',         'Cadeaux',        'Geschenke',      'Regalos',         'Подарунки');

INSERT INTO tags (id, created_at, updated_at, title, title_search)
SELECT
    overlay_tag.id,
    unixepoch('now') - 200 * 86400,
    unixepoch('now') - 200 * 86400,
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_tag.title_fr
        WHEN 'de' THEN overlay_tag.title_de
        WHEN 'es' THEN overlay_tag.title_es
        WHEN 'uk' THEN overlay_tag.title_uk
        ELSE overlay_tag.title_en
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN overlay_tag.title_fr
        WHEN 'de' THEN overlay_tag.title_de
        WHEN 'es' THEN overlay_tag.title_es
        WHEN 'uk' THEN overlay_tag.title_uk
        ELSE overlay_tag.title_en
    END)
FROM overlay_tag
CROSS JOIN overlay_locale;

-- A dense recent week where every row carries a primary tag plus one or two
-- secondary tags, which is what the tag chips and the tag analytics need.
CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
    category_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    primary_tag_id INTEGER,
    secondary_tag_id INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, account_id, category_id, days_ago, minute, amount, primary_tag_id, secondary_tag_id, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (1700, 1, 11, 0,  995, 68300000, 10, 2,  'Farmers Market',   'Marché bio',        'Wochenmarkt',       'Mercado municipal', 'Фермерський ринок'),
    (1701, 2, 12, 0,  760, 24900000, 11, 3,  'Corner Bistro',    'Bistrot du coin',   'Eckkneipe',         'Bar de la esquina', 'Бістро на розі'),
    (1702, 1, 13, 1,  530, 11500000, 12, 1,  'Metro Card Top Up', 'Recharge Navigo',  'Monatskarte',       'Recarga de abono',  'Поповнення проїзного'),
    (1703, 1, 27, 1, 1150, 89400000, 13, 2,  'School Supplies',  'Fournitures scolaires', 'Schulmaterial', 'Material escolar',  'Шкільне приладдя'),
    (1704, 4, 33, 2,  880, 143200000, 14, 2, 'Hardware Store',   'Magasin de bricolage', 'Baumarkt',       'Ferretería',        'Будівельний магазин'),
    (1705, 1, 26, 3, 1090, 55000000, 15, 2,  'Birthday Present', 'Cadeau anniversaire', 'Geburtstagsgeschenk', 'Regalo de cumpleaños', 'Подарунок на день народження'),
    (1706, 1, 11, 4,  945, 74600000, 10, 14, 'Neighbourhood Deli', 'Épicerie fine',   'Feinkostladen',     'Charcutería',       'Делікатеси'),
    (1707, 2, 12, 5,  720, 19800000, 11, 3,  'Ramen Bar',        'Bar à ramen',       'Ramen-Bar',         'Bar de ramen',      'Рамен-бар'),
    (1708, 1, 13, 6,  515, 13200000, 12, 1,  'Bike Share',       'Vélib''',           'Leihrad',           'Bicing',            'Прокат велосипеда'),
    (1709, 1, 27, 7, 1105, 62100000, 13, 15, 'Toy Shop',         'Magasin de jouets', 'Spielzeugladen',    'Juguetería',        'Магазин іграшок');

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
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    overlay_transaction.account_id,
    overlay_transaction.category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT overlay_transaction.id, overlay_transaction.primary_tag_id, 1 FROM overlay_transaction
UNION ALL
SELECT overlay_transaction.id, overlay_transaction.secondary_tag_id, 0 FROM overlay_transaction;

-- Spread the new tags over the existing ledger so the Tags analytics tab has a
-- full month of volume, not just this week's ten rows.
INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT transactions.id, 10, 0
FROM transactions
INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id
WHERE transaction_entries.category_id = 11
  AND transactions.id BETWEEN 101 AND 303;

INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT transactions.id, 11, 0
FROM transactions
INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id
WHERE transaction_entries.category_id = 12
  AND transactions.id BETWEEN 101 AND 303;

INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT transactions.id, 12, 0
FROM transactions
INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id
WHERE transaction_entries.category_id IN (13, 14)
  AND transactions.id BETWEEN 101 AND 303;

INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT transactions.id, 14, 0
FROM transactions
INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id
WHERE transaction_entries.category_id IN (10, 33)
  AND transactions.id BETWEEN 101 AND 303;

-- Anything that ended up tagged but without a primary tag gets its lowest tag
-- promoted, so the primary-tag chip is never missing on a tagged row.
UPDATE transaction_tags
SET is_primary = 1
WHERE is_primary = 0
  AND NOT EXISTS (
      SELECT 1 FROM transaction_tags AS existing
      WHERE existing.transaction_id = transaction_tags.transaction_id AND existing.is_primary = 1
  )
  AND tag_id = (
      SELECT MIN(lowest.tag_id) FROM transaction_tags AS lowest
      WHERE lowest.transaction_id = transaction_tags.transaction_id
  );

DROP TABLE overlay_transaction;
DROP TABLE overlay_tag;
DROP TABLE overlay_locale;
