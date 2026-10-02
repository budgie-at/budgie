-- French (fr) overlay for the store-screenshot showcase dataset.
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
    WHEN 'Main Checking'     THEN 'Compte courant'
    WHEN 'Cash Wallet'       THEN 'Espèces'
    WHEN 'Emergency Savings' THEN 'Épargne de précaution'
    WHEN 'Travel Card'       THEN 'Carte Voyage'
    ELSE title
END;

UPDATE accounts SET title_search = lower(title);

UPDATE tags
SET title = CASE title
    WHEN 'Work'         THEN 'Travail'
    WHEN 'Family'       THEN 'Famille'
    WHEN 'Weekend'      THEN 'Week-end'
    WHEN 'Subscription' THEN 'Abonnement'
    WHEN 'Health'       THEN 'Santé'
    ELSE title
END;

UPDATE tags SET title_search = lower(title);

UPDATE budgets
SET name = CASE name
    WHEN 'Everyday Essentials' THEN 'Dépenses courantes'
    WHEN 'Lifestyle & Fun'     THEN 'Loisirs & plaisirs'
    ELSE name
END;

UPDATE transactions
SET title = CASE title
    WHEN 'Blue Bottle Coffee'   THEN 'Café Coutume'
    WHEN 'Uber'                 THEN 'Uber'
    WHEN 'Whole Foods Market'   THEN 'Carrefour Market'
    WHEN 'Sweetgreen'           THEN 'Cojean'
    WHEN 'Rent'                 THEN 'Loyer'
    WHEN 'AMC Theatres'         THEN 'UGC Ciné Cité'
    WHEN 'Trader Joe''s'        THEN 'Monoprix'
    WHEN 'Shake Shack'          THEN 'Big Fernand'
    WHEN 'Shell Gas Station'    THEN 'TotalEnergies'
    WHEN 'Great Clips'          THEN 'Coiffeur Jean Louis David'
    WHEN 'Amazon'               THEN 'Amazon'
    WHEN 'Chipotle'             THEN 'Brioche Dorée'
    WHEN 'MTA Subway'           THEN 'Navigo RATP'
    WHEN 'Spotify Premium'      THEN 'Spotify Premium'
    WHEN 'Steam'                THEN 'Steam'
    WHEN 'Starbucks'            THEN 'Paul'
    WHEN 'Adobe Creative Cloud' THEN 'Adobe Creative Cloud'
    WHEN 'Equinox Gym'          THEN 'Salle de sport Neoness'
    WHEN 'Costco'               THEN 'Auchan'
    WHEN 'Joe''s Pizza'         THEN 'Pizza Popolare'
    WHEN 'CVS Pharmacy'         THEN 'Pharmacie Centrale'
    WHEN 'Uniqlo'               THEN 'Uniqlo'
    WHEN 'Lyft'                 THEN 'Taxi G7'
    WHEN 'Brooklyn Bowl'        THEN 'Bowling Mouffetard'
    WHEN 'Con Edison'           THEN 'EDF Électricité'
    WHEN 'Thai Villa'           THEN 'Thaï Royal'
    WHEN 'Verizon Fios'         THEN 'Orange Fibre'
    WHEN 'Petco'                THEN 'Animalis'
    WHEN 'Ramen Ichiban'        THEN 'Kodawari Ramen'
    WHEN 'Best Buy'             THEN 'Fnac'
    WHEN 'iCloud+ Storage'      THEN 'iCloud+'
    WHEN 'Sushi Nakamura'       THEN 'Matsuri Sushi'
    WHEN 'Dr. Lin Dental'       THEN 'Cabinet dentaire Voltaire'
    WHEN 'Sephora'              THEN 'Sephora'
    WHEN 'Barclays Center'      THEN 'Accor Arena'
    WHEN 'Trattoria Dell''Arte' THEN 'Bistrot Vivienne'
    WHEN 'Charity: Water'       THEN 'Croix-Rouge française'
    WHEN 'Comedy Cellar'        THEN 'Le Point Virgule'
    WHEN 'Nike Store'           THEN 'Galeries Lafayette'
    WHEN 'Blue Cross Copay'     THEN 'Mutuelle Harmonie'
    WHEN 'IKEA'                 THEN 'IKEA'
    WHEN 'Delta Air Lines'      THEN 'Air France'
    WHEN 'Target'               THEN 'Boulanger'
    WHEN 'Acme Corp Payroll'    THEN 'Salaire Acme SARL'
    WHEN 'Freelance Project'    THEN 'Mission freelance'
    WHEN 'To Emergency Savings' THEN 'Vers l''épargne de précaution'
    WHEN 'Cash Withdrawal'      THEN 'Retrait au DAB'
    ELSE title
END;
