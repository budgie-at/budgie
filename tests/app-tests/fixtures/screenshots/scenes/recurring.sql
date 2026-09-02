-- Scene overlay: subscriptions the recurring calendar can actually detect.
--
-- `transactionPatternRepository.findMonthlyRecurringPatterns` groups EXPENSE /
-- CREDIT rows by (title, account, instrument) and only keeps a group when
--
--   * it spans at least 3 distinct calendar months (MIN_MONTHLY_OCCURRENCES),
--   * `max_amount <= min_amount * 2` (AMOUNT_VARIANCE_MULTIPLIER),
--   * the most common day of month covers at least 40% of the occurrences
--     (DAY_CONCENTRATION_NUMERATOR / DAY_CONCENTRATION_DENOMINATOR),
--   * the newest occurrence is inside the last 12 months (RECENCY_MONTHS),
--   * the transaction is not consolidated and the entry has no
--     `original_transaction_id`, and the account is not a DEBT account.
--
-- So each series here is one title on one account, a fixed day of month, seven
-- months deep, with a constant amount. Series whose day of month has already
-- passed this month get a real occurrence in the current month (a solid dot);
-- the rest are left to render as the calendar's forecast dots.
--
-- Times are pinned to midday so a timezone offset cannot push an occurrence
-- onto the neighbouring day and break the day-of-month concentration test.
--
-- Owns transactions 1900-1999.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1900 AND 1999;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1900 AND 1999;
DELETE FROM transactions WHERE id BETWEEN 1900 AND 1999;

CREATE TEMP TABLE overlay_series (
    series INTEGER,
    account_id INTEGER,
    category_id INTEGER,
    day_of_month INTEGER,
    amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_series (series, account_id, category_id, day_of_month, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (0, 1, 10,  3, 1450000000, 'Rent',              'Loyer',              'Miete',                'Alquiler',            'Оренда квартири'),
    (1, 1, 23,  6,   11990000, 'Spotify Premium',   'Spotify Premium',    'Spotify Premium',      'Spotify Premium',     'Spotify Premium'),
    (2, 1, 23,  9,   54990000, 'Adobe Creative Cloud', 'Adobe Creative Cloud', 'Adobe Creative Cloud', 'Adobe Creative Cloud', 'Adobe Creative Cloud'),
    (3, 1, 10, 12,   74990000, 'Verizon Fios',      'Orange Fibre',       'Telekom Magenta',      'Movistar Fusión',     'Київстар Інтернет'),
    (4, 1, 36, 17,   89000000, 'Equinox Gym',       'Salle de sport Neoness', 'FitX Fitnessstudio', 'Basic-Fit',         'Спортлайф'),
    (5, 1, 23, 21,    9990000, 'iCloud+ Storage',   'iCloud+',            'iCloud+',              'iCloud+',             'iCloud+'),
    (6, 1, 16, 24,  128000000, 'Car Insurance',     'Assurance auto',     'Kfz-Versicherung',     'Seguro del coche',    'Автострахування'),
    (7, 1, 10, 27,   96400000, 'Con Edison',        'EDF Électricité',    'Stadtwerke Strom',     'Iberdrola',           'ДТЕК Електроенергія');

-- Months 1..7 always exist; month 0 (the current one) only when that day of
-- month has already happened, so nothing is ever dated in the future.
CREATE TEMP TABLE overlay_occurrence AS
WITH RECURSIVE month_offset(months_ago) AS (
    SELECT 0
    UNION ALL
    SELECT months_ago + 1 FROM month_offset WHERE months_ago < 7
)
SELECT
    1900 + overlay_series.series * 10 + month_offset.months_ago AS id,
    overlay_series.series AS series,
    unixepoch(datetime(
        date('now', 'start of month', '-' || month_offset.months_ago || ' months', '+' || (overlay_series.day_of_month - 1) || ' days'),
        '12:30:00'
    )) AS operated_at
FROM overlay_series
CROSS JOIN month_offset
WHERE month_offset.months_ago > 0
   OR overlay_series.day_of_month <= CAST(strftime('%d', 'now') AS INTEGER);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_occurrence.id,
    overlay_occurrence.operated_at,
    overlay_occurrence.operated_at,
    'EXPENSE',
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_series.title_fr
        WHEN 'de' THEN overlay_series.title_de
        WHEN 'es' THEN overlay_series.title_es
        WHEN 'uk' THEN overlay_series.title_uk
        ELSE overlay_series.title_en
    END,
    overlay_occurrence.operated_at,
    '',
    overlay_series.account_id,
    NULL,
    1.0,
    0
FROM overlay_occurrence
INNER JOIN overlay_series ON overlay_series.series = overlay_occurrence.series
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_occurrence.id * 10,
    overlay_occurrence.operated_at,
    overlay_occurrence.operated_at,
    'CREDIT',
    overlay_series.account_id,
    overlay_series.category_id,
    overlay_occurrence.id,
    CAST(ROUND(overlay_series.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_occurrence
INNER JOIN overlay_series ON overlay_series.series = overlay_occurrence.series
CROSS JOIN overlay_locale;

DROP TABLE overlay_occurrence;
DROP TABLE overlay_series;
DROP TABLE overlay_locale;
