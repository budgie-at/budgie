-- Includes every live account in net worth, fixes section ordering, and refreshes exchange rate timestamps.

UPDATE accounts
SET
    include_in_net_worth = 1,
    is_active = 1
WHERE deleted_at IS NULL;

UPDATE accounts
SET "order" = CASE type
    WHEN 'BANK' THEN 0
    WHEN 'BANK_SYNC' THEN 1
    WHEN 'CASH' THEN 2
    WHEN 'SAVINGS' THEN 3
    WHEN 'DEPOSIT' THEN 4
    WHEN 'CRYPTO' THEN 5
    WHEN 'STOCKS' THEN 6
    ELSE 7
END * 100 + id
WHERE deleted_at IS NULL;

UPDATE exchange_rates
SET
    created_at = unixepoch('now') - 900,
    updated_at = unixepoch('now') - 900;
