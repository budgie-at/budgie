-- Adds Cyrillic-titled user categories and tags that already carry the AI-generated English title and search keywords.

DELETE FROM transaction_tags WHERE tag_id BETWEEN 20 AND 22;
DELETE FROM merchant_embedding_tags WHERE tag_id BETWEEN 20 AND 22;
DELETE FROM comment_embedding_tags WHERE tag_id BETWEEN 20 AND 22;
DELETE FROM tags WHERE id BETWEEN 20 AND 22;

UPDATE transaction_entries SET category_id = NULL WHERE category_id BETWEEN 60 AND 63;
DELETE FROM categories WHERE id BETWEEN 60 AND 63;

CREATE TEMP TABLE overlay_cyrillic_category (
    id INTEGER,
    title TEXT,
    icon TEXT,
    title_en TEXT,
    title_tags TEXT,
    source_category_id INTEGER,
    entry_limit INTEGER
);

INSERT INTO overlay_cyrillic_category (id, title, icon, title_en, title_tags, source_category_id, entry_limit) VALUES
    (60, 'Сільпо',     'ShoppingBasket', 'silpo supermarket', 'groceries, supermarket, food, market, store, silpo',         11, 6),
    (61, 'Пекарня',    'Croissant',      'bakery',            'bakery, bread, pastry, croissant, dessert, breakfast',       12, 4),
    (62, 'Нова Пошта', 'Package',        'parcel delivery',   'delivery, parcel, shipping, courier, post, logistics',       22, 3),
    (63, 'Аптека',     'Pill',           'pharmacy',          'pharmacy, medicine, drugstore, health, prescription, pills', 15, 2);

INSERT INTO categories (id, created_at, updated_at, title, title_search, icon, is_default, is_system_category, title_en, title_tags, tags_generated_at)
SELECT
    overlay_cyrillic_category.id,
    unixepoch('now') - 180 * 86400,
    unixepoch('now') - 180 * 86400,
    overlay_cyrillic_category.title,
    lower(overlay_cyrillic_category.title),
    overlay_cyrillic_category.icon,
    0,
    0,
    overlay_cyrillic_category.title_en,
    overlay_cyrillic_category.title_tags,
    unixepoch('now') - 3 * 86400
FROM overlay_cyrillic_category;

CREATE TEMP TABLE overlay_cyrillic_entry AS
SELECT
    transaction_entries.id AS entry_id,
    overlay_cyrillic_category.id AS category_id
FROM overlay_cyrillic_category
JOIN transaction_entries ON transaction_entries.category_id = overlay_cyrillic_category.source_category_id
WHERE (
    SELECT COUNT(*)
    FROM transaction_entries AS newer_entries
    WHERE newer_entries.category_id = overlay_cyrillic_category.source_category_id
      AND newer_entries.id >= transaction_entries.id
) <= overlay_cyrillic_category.entry_limit;

UPDATE transaction_entries
SET
    category_id = (SELECT overlay_cyrillic_entry.category_id FROM overlay_cyrillic_entry WHERE overlay_cyrillic_entry.entry_id = transaction_entries.id),
    updated_at = unixepoch('now')
WHERE id IN (SELECT entry_id FROM overlay_cyrillic_entry);

CREATE TEMP TABLE overlay_cyrillic_tag (
    id INTEGER,
    title TEXT,
    title_en TEXT,
    title_tags TEXT
);

INSERT INTO overlay_cyrillic_tag (id, title, title_en, title_tags) VALUES
    (20, 'Комуналка', 'utilities',  'utilities, bills, electricity, water, heating, communal'),
    (21, 'Пальне',    'fuel',       'fuel, gas, petrol, diesel, gasoline, refuel'),
    (22, 'Абонемент', 'membership', 'membership, subscription, gym, pass, plan, fee');

INSERT INTO tags (id, created_at, updated_at, title, title_search, title_en, title_tags, tags_generated_at)
SELECT
    overlay_cyrillic_tag.id,
    unixepoch('now') - 180 * 86400,
    unixepoch('now') - 180 * 86400,
    overlay_cyrillic_tag.title,
    lower(overlay_cyrillic_tag.title),
    overlay_cyrillic_tag.title_en,
    overlay_cyrillic_tag.title_tags,
    unixepoch('now') - 3 * 86400
FROM overlay_cyrillic_tag;
