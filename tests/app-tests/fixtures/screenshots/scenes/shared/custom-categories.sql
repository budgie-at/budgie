-- Adds user-created categories so the Categories settings page is not empty; it only lists non-default rows.

DELETE FROM categories WHERE id BETWEEN 900 AND 999;

INSERT INTO categories (
    id, created_at, updated_at, title, icon, parent_id, is_default, is_system_category,
    title_search, title_en, title_tags, tags_generated_at
)
VALUES
    (901, unixepoch('now'), unixepoch('now'), 'Netflix', 'Popcorn', 23, 0, 0, 'netflix', 'Netflix', 'streaming, movies, series', unixepoch('now')),
    (902, unixepoch('now'), unixepoch('now'), 'Spotify', 'Repeat', 23, 0, 0, 'spotify', 'Spotify', 'music, streaming, playlist', unixepoch('now')),
    (903, unixepoch('now'), unixepoch('now'), 'Airbnb', 'Plane', 29, 0, 0, 'airbnb', 'Airbnb', 'stay, lodging, booking', unixepoch('now')),
    (904, unixepoch('now'), unixepoch('now'), 'Uber', 'Car', 13, 0, 0, 'uber', 'Uber', 'ride, taxi, commute', unixepoch('now')),
    (905, unixepoch('now'), unixepoch('now'), 'IKEA', 'Home', 33, 0, 0, 'ikea', 'IKEA', 'furniture, home, kitchen', unixepoch('now')),
    (906, unixepoch('now'), unixepoch('now'), 'Decathlon', 'Dumbbell', 36, 0, 0, 'decathlon', 'Decathlon', 'sport, gear, outdoor', unixepoch('now')),
    (907, unixepoch('now'), unixepoch('now'), 'Starbucks', 'Utensils', 12, 0, 0, 'starbucks', 'Starbucks', 'coffee, latte, cafe', unixepoch('now')),
    (908, unixepoch('now'), unixepoch('now'), 'Amazon', 'ShoppingBag', 22, 0, 0, 'amazon', 'Amazon', 'online, parcel, delivery', unixepoch('now'));

UPDATE transaction_entries
SET
    category_id = 901,
    updated_at = unixepoch('now')
WHERE transaction_id IN (
    SELECT transactions.id
    FROM transactions
    WHERE transactions.id BETWEEN 101 AND 199
      AND transactions.type = 'EXPENSE'
      AND transactions.deleted_at IS NULL
    ORDER BY transactions.operated_at DESC
    LIMIT 3
);
