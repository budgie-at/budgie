-- Adds categorisation rules including a conflicting pair, one of them disabled.

CREATE TEMP TABLE overlay_locale AS SELECT settings.language AS language FROM settings;

DELETE FROM rule_actions WHERE rule_id BETWEEN 1 AND 5;
DELETE FROM rule_conditions WHERE rule_id BETWEEN 1 AND 5;
DELETE FROM rules WHERE id BETWEEN 1 AND 5;

INSERT INTO rules (id, created_at, updated_at, enabled, condition_match_type) VALUES
    (1, unixepoch('now') - 180 * 86400, unixepoch('now') - 12 * 86400, 1, 'ALL'),
    (2, unixepoch('now') - 150 * 86400, unixepoch('now') - 30 * 86400, 1, 'ANY'),
    (3, unixepoch('now') - 120 * 86400, unixepoch('now') - 45 * 86400, 1, 'ALL'),
    (4, unixepoch('now') -  90 * 86400, unixepoch('now') -  8 * 86400, 1, 'ALL'),
    (5, unixepoch('now') -  60 * 86400, unixepoch('now') -  8 * 86400, 0, 'ALL');

CREATE TEMP TABLE overlay_condition (
    id INTEGER,
    rule_id INTEGER,
    field TEXT,
    operator TEXT,
    value_en TEXT,
    value_fr TEXT,
    value_de TEXT,
    value_es TEXT,
    value_uk TEXT,
    secondary_value TEXT
);

INSERT INTO overlay_condition (id, rule_id, field, operator, value_en, value_fr, value_de, value_es, value_uk, secondary_value) VALUES
    (1, 1, 'TITLE',            'CONTAINS',     'Spotify',       'Spotify',        'Spotify',       'Spotify',        'Spotify',        NULL),
    (2, 1, 'TRANSACTION_TYPE', 'EQUALS',       'EXPENSE',       'EXPENSE',        'EXPENSE',       'EXPENSE',        'EXPENSE',        NULL),
    (3, 2, 'MCC_CODE',         'EQUALS',       '5411',          '5411',           '5411',          '5411',           '5411',           NULL),
    (4, 2, 'TITLE',            'CONTAINS',     'Market',        'Marché',         'Markt',         'Mercado',        'Ринок',          NULL),
    (5, 3, 'AMOUNT',           'BETWEEN',      '1000000',       '1000000',        '1000000',       '1000000',        '1000000',        '15000000'),
    (6, 3, 'EXTERNAL_SOURCE',  'EQUALS',       'MONOBANK',      'MONOBANK',       'MONOBANK',      'MONOBANK',       'MONOBANK',       NULL),
    (7, 4, 'TITLE',            'CONTAINS',     'Whole Foods',   'Carrefour',      'REWE',          'Mercadona',      'Сільпо',         NULL),
    (8, 5, 'TITLE',            'CONTAINS',     'Whole Foods',   'Carrefour',      'REWE',          'Mercadona',      'Сільпо',         NULL),
    (9, 5, 'TRANSACTION_TYPE', 'NOT_EQUALS',   'TRANSFER',      'TRANSFER',       'TRANSFER',      'TRANSFER',       'TRANSFER',       NULL);

INSERT INTO rule_conditions (id, created_at, updated_at, rule_id, field, operator, value, secondary_value)
SELECT
    overlay_condition.id,
    unixepoch('now') - 180 * 86400,
    unixepoch('now') - 12 * 86400,
    overlay_condition.rule_id,
    overlay_condition.field,
    overlay_condition.operator,
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_condition.value_fr
        WHEN 'de' THEN overlay_condition.value_de
        WHEN 'es' THEN overlay_condition.value_es
        WHEN 'uk' THEN overlay_condition.value_uk
        ELSE overlay_condition.value_en
    END,
    overlay_condition.secondary_value
FROM overlay_condition
CROSS JOIN overlay_locale;

INSERT INTO rule_actions (id, created_at, updated_at, rule_id, type, category_id, tag_id, account_id) VALUES
    (1, unixepoch('now') - 180 * 86400, unixepoch('now') - 12 * 86400, 1, 'SET_CATEGORY', 23,   NULL, NULL),
    (2, unixepoch('now') - 180 * 86400, unixepoch('now') - 12 * 86400, 1, 'ADD_TAG',      NULL, 4,    NULL),
    (3, unixepoch('now') - 150 * 86400, unixepoch('now') - 30 * 86400, 2, 'SET_CATEGORY', 11,   NULL, NULL),
    (4, unixepoch('now') - 120 * 86400, unixepoch('now') - 45 * 86400, 3, 'SET_CATEGORY', 32,   NULL, NULL),
    (5, unixepoch('now') -  90 * 86400, unixepoch('now') -  8 * 86400, 4, 'SET_CATEGORY', 11,   NULL, NULL),
    (6, unixepoch('now') -  90 * 86400, unixepoch('now') -  8 * 86400, 4, 'ADD_TAG',      NULL, 2,    NULL),
    (7, unixepoch('now') -  60 * 86400, unixepoch('now') -  8 * 86400, 5, 'SET_CATEGORY', 22,   NULL, NULL);

DROP TABLE overlay_condition;
DROP TABLE overlay_locale;
