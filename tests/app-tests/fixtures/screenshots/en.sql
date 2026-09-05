-- English (en) overlay for the store-screenshot showcase dataset.
--
-- The base showcase dataset is authored in English with USD amounts, so this
-- overlay only pins the display currency. It exists so every locale in the
-- capture manifest resolves to a real overlay file and the seed hook has no
-- special case.
--
-- Language and theme are NOT set here; the seed hook owns both.

UPDATE accounts SET instrument_id = 1;

UPDATE budgets SET instrument_id = 1;

UPDATE settings SET default_instrument_id = 1, show_cents = 1;
