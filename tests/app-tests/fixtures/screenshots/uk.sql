-- Ukrainian (uk) overlay for the store-screenshot showcase dataset.
--
-- Applied by seed-screenshot-scene.sh after showcase.db is copied and before
-- shift-dates.sql. Rewrites every user-visible string and switches the display
-- currency to UAH. Amounts are scaled 15x from the USD base and rounded to
-- whole hryvnia, which lands every merchant, salary and balance in a realistic
-- Ukrainian range.
--
-- Category names are NOT translated here: they come from the app's
-- `default_category_translations` rows, which already cover all five locales.
-- Language and theme are NOT set here either; the seed hook owns both.

UPDATE transaction_entries SET amount = CAST(ROUND(amount * 15.0 / 1000000.0) * 1000000 AS INTEGER);

UPDATE account_balances SET amount = CAST(ROUND(amount * 15.0 / 1000000.0) * 1000000 AS INTEGER);

UPDATE budgets
SET
    overall_limit = overall_limit * 15,
    other_limit = other_limit * 15;

UPDATE budget_category_limits
SET limit_amount = limit_amount * 15;

UPDATE accounts SET instrument_id = 33;

UPDATE budgets SET instrument_id = 33;

UPDATE settings SET default_instrument_id = 33, show_cents = 0;

UPDATE accounts
SET title = CASE title
    WHEN 'Main Checking'     THEN 'Основний рахунок'
    WHEN 'Cash Wallet'       THEN 'Готівка'
    WHEN 'Emergency Savings' THEN 'Резервний фонд'
    WHEN 'Travel Card'       THEN 'Картка для подорожей'
    ELSE title
END;

UPDATE accounts SET title_search = lower(title);

UPDATE tags
SET title = CASE title
    WHEN 'Work'         THEN 'Робота'
    WHEN 'Family'       THEN 'Сім''я'
    WHEN 'Weekend'      THEN 'Вихідні'
    WHEN 'Subscription' THEN 'Підписка'
    WHEN 'Health'       THEN 'Здоров''я'
    ELSE title
END;

UPDATE tags SET title_search = lower(title);

UPDATE budgets
SET name = CASE name
    WHEN 'Everyday Essentials' THEN 'Щоденні витрати'
    WHEN 'Lifestyle & Fun'     THEN 'Дозвілля та розваги'
    ELSE name
END;

UPDATE transactions
SET title = CASE title
    WHEN 'Blue Bottle Coffee'   THEN 'Aroma Kava'
    WHEN 'Uber'                 THEN 'Uklon'
    WHEN 'Whole Foods Market'   THEN 'Сільпо'
    WHEN 'Sweetgreen'           THEN 'Salateira'
    WHEN 'Rent'                 THEN 'Оренда квартири'
    WHEN 'AMC Theatres'         THEN 'Кінотеатр «Оскар»'
    WHEN 'Trader Joe''s'        THEN 'АТБ'
    WHEN 'Shake Shack'          THEN 'Burger Club'
    WHEN 'Shell Gas Station'    THEN 'WOG'
    WHEN 'Great Clips'          THEN 'Перукарня Chop-Chop'
    WHEN 'Amazon'               THEN 'Rozetka'
    WHEN 'Chipotle'             THEN 'Пузата Хата'
    WHEN 'MTA Subway'           THEN 'Київський метрополітен'
    WHEN 'Spotify Premium'      THEN 'Spotify Premium'
    WHEN 'Steam'                THEN 'Steam'
    WHEN 'Starbucks'            THEN 'One Love Coffee'
    WHEN 'Adobe Creative Cloud' THEN 'Adobe Creative Cloud'
    WHEN 'Equinox Gym'          THEN 'Спортлайф'
    WHEN 'Costco'               THEN 'METRO'
    WHEN 'Joe''s Pizza'         THEN 'Піца Челентано'
    WHEN 'CVS Pharmacy'         THEN 'Аптека Доброго Дня'
    WHEN 'Uniqlo'               THEN 'Intertop'
    WHEN 'Lyft'                 THEN 'Bolt'
    WHEN 'Brooklyn Bowl'        THEN 'Боулінг «Атлас»'
    WHEN 'Con Edison'           THEN 'ДТЕК Електроенергія'
    WHEN 'Thai Villa'           THEN 'Thai Wok'
    WHEN 'Verizon Fios'         THEN 'Київстар Інтернет'
    WHEN 'Petco'                THEN 'Мастер Зоо'
    WHEN 'Ramen Ichiban'        THEN 'Ramen Nakama'
    WHEN 'Best Buy'             THEN 'Comfy'
    WHEN 'iCloud+ Storage'      THEN 'iCloud+'
    WHEN 'Sushi Nakamura'       THEN 'Sushi Master'
    WHEN 'Dr. Lin Dental'       THEN 'Стоматологія «Люмі-Дент»'
    WHEN 'Sephora'              THEN 'Watsons'
    WHEN 'Barclays Center'      THEN 'Палац спорту'
    WHEN 'Trattoria Dell''Arte' THEN 'Траторія «Мамамія»'
    WHEN 'Charity: Water'       THEN 'Повернись живим'
    WHEN 'Comedy Cellar'        THEN 'Підпільний стендап'
    WHEN 'Nike Store'           THEN 'Arber'
    WHEN 'Blue Cross Copay'     THEN 'Клініка «Добробут»'
    WHEN 'IKEA'                 THEN 'Епіцентр'
    WHEN 'Delta Air Lines'      THEN 'Wizz Air'
    WHEN 'Target'               THEN 'Нова Пошта'
    WHEN 'Acme Corp Payroll'    THEN 'Зарплата ТОВ «Акме»'
    WHEN 'Freelance Project'    THEN 'Фриланс-проєкт'
    WHEN 'To Emergency Savings' THEN 'На резервний фонд'
    WHEN 'Cash Withdrawal'      THEN 'Зняття готівки'
    ELSE title
END;
