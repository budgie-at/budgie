-- Synthetic-only debt cards spanning every progress state, for a Home debt-section design comparison.

DELETE FROM account_balances WHERE account_id BETWEEN 901 AND 909;
DELETE FROM debt_events WHERE debt_account_id BETWEEN 901 AND 909;
DELETE FROM accounts WHERE id BETWEEN 901 AND 909;

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, deadline, target_balance, include_in_net_worth, is_active
) VALUES
    (901, unixepoch('now') - 60 * 86400, unixepoch('now') - 5 * 86400, 'HandCoins', 901, 'Synthetic debt A', 'synthetic debt a', 'DEBT', 'ASSET', 'LENT', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 45 * 86400, 0, 1, 1),
    (902, unixepoch('now') - 60 * 86400, unixepoch('now') - 15 * 86400, 'HandCoins', 902, 'Synthetic debt B', 'synthetic debt b', 'DEBT', 'ASSET', 'LENT', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 30 * 86400, 0, 1, 1),
    (903, unixepoch('now') - 90 * 86400, unixepoch('now') - 10 * 86400, 'HandCoins', 903, 'Synthetic debt C', 'synthetic debt c', 'DEBT', 'ASSET', 'LENT', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 5 * 86400, 0, 1, 1),
    (904, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 'HandCoins', 904, 'Synthetic debt D', 'synthetic debt d', 'DEBT', 'ASSET', 'LENT', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 60 * 86400, 0, 1, 1),
    (905, unixepoch('now') - 60 * 86400, unixepoch('now') - 5 * 86400, 'Handshake', 905, 'Synthetic debt E', 'synthetic debt e', 'DEBT', 'LIABILITY', 'BORROW', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 45 * 86400, 0, 1, 1),
    (906, unixepoch('now') - 60 * 86400, unixepoch('now') - 15 * 86400, 'Handshake', 906, 'Synthetic debt F', 'synthetic debt f', 'DEBT', 'LIABILITY', 'BORROW', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 30 * 86400, 0, 1, 1),
    (907, unixepoch('now') - 90 * 86400, unixepoch('now') - 10 * 86400, 'Handshake', 907, 'Synthetic debt G', 'synthetic debt g', 'DEBT', 'LIABILITY', 'BORROW', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 5 * 86400, 0, 1, 1),
    (908, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 'Handshake', 908, 'Synthetic debt H', 'synthetic debt h', 'DEBT', 'LIABILITY', 'BORROW', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 60 * 86400, 0, 1, 1),
    (909, unixepoch('now') - 200 * 86400, unixepoch('now') - 20 * 86400, 'HandCoins', 909, 'Synthetic debt L', 'synthetic debt l', 'DEBT', 'ASSET', 'LENT', (SELECT instrument_id FROM accounts WHERE id = 1), unixepoch('now') + 10 * 86400, 0, 1, 1);

INSERT INTO debt_events (id, created_at, updated_at, debt_account_id, transaction_id, transaction_entry_id, direction, source, amount, operated_at) VALUES
    (9010, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 901, NULL, NULL, 'OPEN', 'MANUAL', 1000000000, unixepoch('now') - 60 * 86400),
    (9020, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 902, NULL, NULL, 'OPEN', 'MANUAL', 1000000000, unixepoch('now') - 60 * 86400),
    (9021, unixepoch('now') - 15 * 86400, unixepoch('now') - 15 * 86400, 902, NULL, NULL, 'CLOSE', 'MANUAL', 250000000, unixepoch('now') - 15 * 86400),
    (9030, unixepoch('now') - 90 * 86400, unixepoch('now') - 90 * 86400, 903, NULL, NULL, 'OPEN', 'MANUAL', 1000000000, unixepoch('now') - 90 * 86400),
    (9031, unixepoch('now') - 10 * 86400, unixepoch('now') - 10 * 86400, 903, NULL, NULL, 'CLOSE', 'MANUAL', 1000000000, unixepoch('now') - 10 * 86400),
    (9050, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 905, NULL, NULL, 'OPEN', 'MANUAL', 1000000000, unixepoch('now') - 60 * 86400),
    (9060, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 906, NULL, NULL, 'OPEN', 'MANUAL', 1000000000, unixepoch('now') - 60 * 86400),
    (9061, unixepoch('now') - 15 * 86400, unixepoch('now') - 15 * 86400, 906, NULL, NULL, 'CLOSE', 'MANUAL', 250000000, unixepoch('now') - 15 * 86400),
    (9070, unixepoch('now') - 90 * 86400, unixepoch('now') - 90 * 86400, 907, NULL, NULL, 'OPEN', 'MANUAL', 1000000000, unixepoch('now') - 90 * 86400),
    (9071, unixepoch('now') - 10 * 86400, unixepoch('now') - 10 * 86400, 907, NULL, NULL, 'CLOSE', 'MANUAL', 1000000000, unixepoch('now') - 10 * 86400),
    (9090, unixepoch('now') - 200 * 86400, unixepoch('now') - 200 * 86400, 909, NULL, NULL, 'OPEN', 'MANUAL', 1234567890000, unixepoch('now') - 200 * 86400),
    (9091, unixepoch('now') - 20 * 86400, unixepoch('now') - 20 * 86400, 909, NULL, NULL, 'CLOSE', 'MANUAL', 250000000000, unixepoch('now') - 20 * 86400);

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount) VALUES
    (9901, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 901, 0),
    (9902, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 902, 0),
    (9903, unixepoch('now') - 90 * 86400, unixepoch('now') - 90 * 86400, 903, 0),
    (9904, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 904, 0),
    (9905, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 905, 0),
    (9906, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 906, 0),
    (9907, unixepoch('now') - 90 * 86400, unixepoch('now') - 90 * 86400, 907, 0),
    (9908, unixepoch('now') - 60 * 86400, unixepoch('now') - 60 * 86400, 908, 0),
    (9909, unixepoch('now') - 200 * 86400, unixepoch('now') - 200 * 86400, 909, 0);
