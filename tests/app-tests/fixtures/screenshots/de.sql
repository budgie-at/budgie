-- German (de) overlay for the store-screenshot showcase dataset.
--
-- Applied by seed-screenshot-scene.sh after showcase.db is copied and before
-- shift-dates.sql. Rewrites every user-visible string and switches the display
-- currency to EUR. Amounts are scaled 0.92x from the USD base and rounded to
-- whole cents.
--
-- Category names are NOT translated here: they come from the app's
-- `default_category_translations` rows, which already cover all five locales.
-- Language and theme are NOT set here either; the seed hook owns both.

UPDATE transaction_entries SET amount = CAST(ROUND(amount * 0.92 / 10000.0) * 10000 AS INTEGER);

UPDATE account_balances SET amount = CAST(ROUND(amount * 0.92 / 10000.0) * 10000 AS INTEGER);

UPDATE budgets
SET
    overall_limit = CASE id WHEN 1 THEN 3700000000 ELSE 5420000000 END,
    other_limit = CASE id WHEN 1 THEN 1240000000 ELSE 4320000000 END;

UPDATE budget_category_limits
SET limit_amount = CASE category_id
    WHEN 10 THEN 1560000000
    WHEN 11 THEN  640000000
    WHEN 13 THEN  140000000
    WHEN 14 THEN  120000000
    WHEN 12 THEN  350000000
    WHEN 22 THEN  370000000
    WHEN 23 THEN   90000000
    WHEN 24 THEN  290000000
    ELSE limit_amount
END;

UPDATE accounts SET instrument_id = 2;

UPDATE budgets SET instrument_id = 2;

UPDATE settings SET default_instrument_id = 2, show_cents = 1;

UPDATE accounts
SET title = CASE title
    WHEN 'Main Checking'     THEN 'Girokonto'
    WHEN 'Cash Wallet'       THEN 'Bargeld'
    WHEN 'Emergency Savings' THEN 'Notgroschen'
    WHEN 'Travel Card'       THEN 'Reisekarte'
    ELSE title
END;

UPDATE accounts SET title_search = lower(title);

UPDATE tags
SET title = CASE title
    WHEN 'Work'         THEN 'Arbeit'
    WHEN 'Family'       THEN 'Familie'
    WHEN 'Weekend'      THEN 'Wochenende'
    WHEN 'Subscription' THEN 'Abo'
    WHEN 'Health'       THEN 'Gesundheit'
    ELSE title
END;

UPDATE tags SET title_search = lower(title);

UPDATE budgets
SET name = CASE name
    WHEN 'Everyday Essentials' THEN 'Alltagsausgaben'
    WHEN 'Lifestyle & Fun'     THEN 'Freizeit & Genuss'
    ELSE name
END;

UPDATE transactions
SET title = CASE title
    WHEN 'Blue Bottle Coffee'   THEN 'The Barn Coffee'
    WHEN 'Uber'                 THEN 'Uber'
    WHEN 'Whole Foods Market'   THEN 'REWE'
    WHEN 'Sweetgreen'           THEN 'Dean & David'
    WHEN 'Rent'                 THEN 'Miete'
    WHEN 'AMC Theatres'         THEN 'CineStar'
    WHEN 'Trader Joe''s'        THEN 'EDEKA'
    WHEN 'Shake Shack'          THEN 'Hans im Glück'
    WHEN 'Shell Gas Station'    THEN 'Aral Tankstelle'
    WHEN 'Great Clips'          THEN 'Friseur Klier'
    WHEN 'Amazon'               THEN 'Amazon'
    WHEN 'Chipotle'             THEN 'Vapiano'
    WHEN 'MTA Subway'           THEN 'Deutsche Bahn'
    WHEN 'Spotify Premium'      THEN 'Spotify Premium'
    WHEN 'Steam'                THEN 'Steam'
    WHEN 'Starbucks'            THEN 'Starbucks'
    WHEN 'Adobe Creative Cloud' THEN 'Adobe Creative Cloud'
    WHEN 'Equinox Gym'          THEN 'McFit Fitnessstudio'
    WHEN 'Costco'               THEN 'Kaufland'
    WHEN 'Joe''s Pizza'         THEN 'Pizzeria Napoli'
    WHEN 'CVS Pharmacy'         THEN 'Apotheke am Markt'
    WHEN 'Uniqlo'               THEN 'Uniqlo'
    WHEN 'Lyft'                 THEN 'FreeNow Taxi'
    WHEN 'Brooklyn Bowl'        THEN 'Bowling Center'
    WHEN 'Con Edison'           THEN 'Vattenfall Strom'
    WHEN 'Thai Villa'           THEN 'Thai Palast'
    WHEN 'Verizon Fios'         THEN 'Telekom Internet'
    WHEN 'Petco'                THEN 'Fressnapf'
    WHEN 'Ramen Ichiban'        THEN 'Cocolo Ramen'
    WHEN 'Best Buy'             THEN 'MediaMarkt'
    WHEN 'iCloud+ Storage'      THEN 'iCloud+'
    WHEN 'Sushi Nakamura'       THEN 'Ishin Sushi'
    WHEN 'Dr. Lin Dental'       THEN 'Zahnarztpraxis Dr. Weber'
    WHEN 'Sephora'              THEN 'Douglas'
    WHEN 'Barclays Center'      THEN 'Mercedes-Benz Arena'
    WHEN 'Trattoria Dell''Arte' THEN 'Trattoria Toscana'
    WHEN 'Charity: Water'       THEN 'Brot für die Welt'
    WHEN 'Comedy Cellar'        THEN 'Quatsch Comedy Club'
    WHEN 'Nike Store'           THEN 'Peek & Cloppenburg'
    WHEN 'Blue Cross Copay'     THEN 'TK Zuzahlung'
    WHEN 'IKEA'                 THEN 'IKEA'
    WHEN 'Delta Air Lines'      THEN 'Lufthansa'
    WHEN 'Target'               THEN 'Galeria'
    WHEN 'Acme Corp Payroll'    THEN 'Gehalt Acme GmbH'
    WHEN 'Freelance Project'    THEN 'Freelance-Projekt'
    WHEN 'To Emergency Savings' THEN 'Auf den Notgroschen'
    WHEN 'Cash Withdrawal'      THEN 'Bargeldabhebung'
    ELSE title
END;
