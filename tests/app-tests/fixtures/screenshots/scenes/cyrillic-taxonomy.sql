-- Scene overlay: user taxonomy that the on-device translator has already
-- processed.
--
-- `ai-merchant-translation` renders `categories.title_en` / `categories.title_tags`
-- (and the same pair on `tags`) through `@generic/component/ai-translation-fields`.
-- Both are persisted columns, so seeding them shows the finished state with no
-- inference and no AI-enabled build.
--
-- Format matches `TranslationLlmService`: `title_en` is the lowercase English
-- title, `title_tags` is a lowercase `', '`-joined keyword list.
--
-- Locale handling. The feature exists because a user names things in their own
-- language, so the seeded titles ARE that language: Cyrillic for `uk`, the
-- locale's own words for `fr`/`de`/`es`, and a Cyrillic/Greek mix for `en` (a
-- bilingual user's own taxonomy). The English side is identical everywhere,
-- because that is what the model would produce.
--
-- Owns categories 100-104 and tags 20-23.

CREATE TEMP TABLE overlay_locale AS SELECT settings.language AS language FROM settings;

DELETE FROM merchant_embedding_tags WHERE tag_id BETWEEN 20 AND 23;
DELETE FROM comment_embedding_tags WHERE tag_id BETWEEN 20 AND 23;
DELETE FROM transaction_tags WHERE tag_id BETWEEN 20 AND 23;
DELETE FROM tags WHERE id BETWEEN 20 AND 23;
UPDATE transaction_entries SET category_id = 38 WHERE category_id BETWEEN 100 AND 104;
DELETE FROM budget_category_limits WHERE category_id BETWEEN 100 AND 104;
DELETE FROM categories WHERE id BETWEEN 100 AND 104;

CREATE TEMP TABLE overlay_category (
    id INTEGER,
    icon TEXT,
    title_en_locale TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT,
    translated_title TEXT,
    translated_tags TEXT
);

INSERT INTO overlay_category (id, icon, title_en_locale, title_fr, title_de, title_es, title_uk, translated_title, translated_tags) VALUES
    (100, 'Utensils',  'Кава',         'Café du matin',      'Kaffee unterwegs',   'Café de la mañana', 'Кава',         'coffee',        'coffee, cafe, espresso, latte, barista, takeaway'),
    (101, 'Bus',       'Таксі',        'Taxi et VTC',        'Taxi und Fahrdienst', 'Taxi y VTC',       'Таксі',        'taxi',          'taxi, transport, uber, ride, cab, commute'),
    (102, 'Baby',      'Παιδικά',      'Dépenses enfants',   'Kinderausgaben',     'Gastos de niños',   'Дитячі витрати', 'children',    'children, kids, baby, childcare, toys, school'),
    (103, 'HeartPulse', 'Здоров''я',   'Santé et pharmacie', 'Gesundheit',         'Salud y farmacia',  'Здоров''я',    'health',        'health, medical, doctor, pharmacy, hospital, medicine'),
    (104, 'Gift',      'Подарунки',    'Cadeaux',            'Geschenke',          'Regalos',           'Подарунки',    'gifts',         'gifts, presents, birthday, celebration, holiday');

INSERT INTO categories (id, created_at, updated_at, title, title_search, icon, is_default, is_system_category, title_en, title_tags, tags_generated_at)
SELECT
    overlay_category.id,
    unixepoch('now') - 90 * 86400,
    unixepoch('now') - 6 * 86400,
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_category.title_fr
        WHEN 'de' THEN overlay_category.title_de
        WHEN 'es' THEN overlay_category.title_es
        WHEN 'uk' THEN overlay_category.title_uk
        ELSE overlay_category.title_en_locale
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN overlay_category.title_fr
        WHEN 'de' THEN overlay_category.title_de
        WHEN 'es' THEN overlay_category.title_es
        WHEN 'uk' THEN overlay_category.title_uk
        ELSE overlay_category.title_en_locale
    END),
    overlay_category.icon,
    0,
    0,
    overlay_category.translated_title,
    overlay_category.translated_tags,
    unixepoch('now') - 6 * 86400
FROM overlay_category
CROSS JOIN overlay_locale;

CREATE TEMP TABLE overlay_tag (
    id INTEGER,
    title_en_locale TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT,
    translated_title TEXT,
    translated_tags TEXT
);

INSERT INTO overlay_tag (id, title_en_locale, title_fr, title_de, title_es, title_uk, translated_title, translated_tags) VALUES
    (20, 'Відпустка',  'Vacances',   'Urlaub',        'Vacaciones',    'Відпустка',  'vacation',  'vacation, holiday, travel, trip, leave, getaway'),
    (21, 'Ремонт',     'Travaux',    'Renovierung',   'Reformas',      'Ремонт',     'renovation', 'renovation, repair, diy, builder, home, maintenance'),
    (22, 'Δώρα',       'Anniversaire', 'Geburtstag',  'Cumpleaños',    'Подарунки',  'birthday',  'birthday, gifts, presents, party, celebration'),
    (23, 'Авто',       'Voiture',    'Auto',          'Coche',         'Авто',       'car',       'car, auto, vehicle, fuel, garage, service');

INSERT INTO tags (id, created_at, updated_at, title, title_search, title_en, title_tags, tags_generated_at)
SELECT
    overlay_tag.id,
    unixepoch('now') - 90 * 86400,
    unixepoch('now') - 6 * 86400,
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_tag.title_fr
        WHEN 'de' THEN overlay_tag.title_de
        WHEN 'es' THEN overlay_tag.title_es
        WHEN 'uk' THEN overlay_tag.title_uk
        ELSE overlay_tag.title_en_locale
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN overlay_tag.title_fr
        WHEN 'de' THEN overlay_tag.title_de
        WHEN 'es' THEN overlay_tag.title_es
        WHEN 'uk' THEN overlay_tag.title_uk
        ELSE overlay_tag.title_en_locale
    END),
    overlay_tag.translated_title,
    overlay_tag.translated_tags,
    unixepoch('now') - 6 * 86400
FROM overlay_tag
CROSS JOIN overlay_locale;

-- The custom categories must carry real spend, otherwise the category list
-- renders them as empty rows below the defaults.
UPDATE transaction_entries
SET category_id = 100, category_source = 'USER'
WHERE transaction_id IN (101, 123, 147);

UPDATE transaction_entries
SET category_id = 101, category_source = 'USER'
WHERE transaction_id IN (102, 148, 171);

UPDATE transaction_entries
SET category_id = 102, category_source = 'USER'
WHERE transaction_id IN (122, 174);

UPDATE transaction_entries
SET category_id = 103, category_source = 'USER'
WHERE transaction_id IN (121, 162);

UPDATE transaction_entries
SET category_id = 104, category_source = 'USER'
WHERE transaction_id = 152;

INSERT INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT 172, 20, 1
WHERE NOT EXISTS (SELECT 1 FROM transaction_tags WHERE transaction_id = 172 AND tag_id = 20);

INSERT INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT 169, 21, 1
WHERE NOT EXISTS (SELECT 1 FROM transaction_tags WHERE transaction_id = 169 AND tag_id = 21);

INSERT INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT 152, 22, 1
WHERE NOT EXISTS (SELECT 1 FROM transaction_tags WHERE transaction_id = 152 AND tag_id = 22);

INSERT INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT 167, 23, 1
WHERE NOT EXISTS (SELECT 1 FROM transaction_tags WHERE transaction_id = 167 AND tag_id = 23);

DROP TABLE overlay_tag;
DROP TABLE overlay_category;
DROP TABLE overlay_locale;
