-- Spanish (es) overlay for the store-screenshot showcase dataset.
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
    WHEN 'Main Checking'     THEN 'Cuenta corriente'
    WHEN 'Cash Wallet'       THEN 'Efectivo'
    WHEN 'Emergency Savings' THEN 'Fondo de emergencia'
    WHEN 'Travel Card'       THEN 'Tarjeta de viaje'
    ELSE title
END;

UPDATE accounts SET title_search = lower(title);

UPDATE tags
SET title = CASE title
    WHEN 'Work'         THEN 'Trabajo'
    WHEN 'Family'       THEN 'Familia'
    WHEN 'Weekend'      THEN 'Fin de semana'
    WHEN 'Subscription' THEN 'Suscripción'
    WHEN 'Health'       THEN 'Salud'
    ELSE title
END;

UPDATE tags SET title_search = lower(title);

UPDATE budgets
SET name = CASE name
    WHEN 'Everyday Essentials' THEN 'Gastos esenciales'
    WHEN 'Lifestyle & Fun'     THEN 'Ocio y disfrute'
    ELSE name
END;

UPDATE transactions
SET title = CASE title
    WHEN 'Blue Bottle Coffee'   THEN 'Café Federal'
    WHEN 'Uber'                 THEN 'Cabify'
    WHEN 'Whole Foods Market'   THEN 'Mercadona'
    WHEN 'Sweetgreen'           THEN 'Honest Greens'
    WHEN 'Rent'                 THEN 'Alquiler'
    WHEN 'AMC Theatres'         THEN 'Cines Yelmo'
    WHEN 'Trader Joe''s'        THEN 'Carrefour Express'
    WHEN 'Shake Shack'          THEN 'Goiko'
    WHEN 'Shell Gas Station'    THEN 'Repsol'
    WHEN 'Great Clips'          THEN 'Peluquería Marco Aldany'
    WHEN 'Amazon'               THEN 'Amazon'
    WHEN 'Chipotle'             THEN 'Tierra Burrito'
    WHEN 'MTA Subway'           THEN 'Renfe Cercanías'
    WHEN 'Spotify Premium'      THEN 'Spotify Premium'
    WHEN 'Steam'                THEN 'Steam'
    WHEN 'Starbucks'            THEN 'Starbucks'
    WHEN 'Adobe Creative Cloud' THEN 'Adobe Creative Cloud'
    WHEN 'Equinox Gym'          THEN 'Gimnasio Basic-Fit'
    WHEN 'Costco'               THEN 'Alcampo'
    WHEN 'Joe''s Pizza'         THEN 'Pizzería Da Nanni'
    WHEN 'CVS Pharmacy'         THEN 'Farmacia Central'
    WHEN 'Uniqlo'               THEN 'Zara'
    WHEN 'Lyft'                 THEN 'Free Now Taxi'
    WHEN 'Brooklyn Bowl'        THEN 'Bolera Chamartín'
    WHEN 'Con Edison'           THEN 'Iberdrola'
    WHEN 'Thai Villa'           THEN 'Bangkok Café'
    WHEN 'Verizon Fios'         THEN 'Movistar Fibra'
    WHEN 'Petco'                THEN 'Kiwoko'
    WHEN 'Ramen Ichiban'        THEN 'Ramen Kagura'
    WHEN 'Best Buy'             THEN 'MediaMarkt'
    WHEN 'iCloud+ Storage'      THEN 'iCloud+'
    WHEN 'Sushi Nakamura'       THEN 'Sushi Artist'
    WHEN 'Dr. Lin Dental'       THEN 'Clínica Dental Sanz'
    WHEN 'Sephora'              THEN 'Primor'
    WHEN 'Barclays Center'      THEN 'WiZink Center'
    WHEN 'Trattoria Dell''Arte' THEN 'Trattoria Il Forno'
    WHEN 'Charity: Water'       THEN 'Cruz Roja'
    WHEN 'Comedy Cellar'        THEN 'Club de la Comedia'
    WHEN 'Nike Store'           THEN 'El Corte Inglés'
    WHEN 'Blue Cross Copay'     THEN 'Copago Sanitas'
    WHEN 'IKEA'                 THEN 'IKEA'
    WHEN 'Delta Air Lines'      THEN 'Iberia'
    WHEN 'Target'               THEN 'Leroy Merlin'
    WHEN 'Acme Corp Payroll'    THEN 'Nómina Acme S.L.'
    WHEN 'Freelance Project'    THEN 'Proyecto freelance'
    WHEN 'To Emergency Savings' THEN 'Al fondo de emergencia'
    WHEN 'Cash Withdrawal'      THEN 'Retirada de efectivo'
    ELSE title
END;
