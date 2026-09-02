-- Scene overlay: the composed home hero.
--
-- Unlike the other overlays this one inserts nothing. It is the FINISHING step
-- of the stack the hero scenes declare in scene-overlays.json:
--
--   ["multi-currency", "deposit", "crypto", "debt", "net-worth-full"]
--
-- Composing the existing overlays instead of duplicating their rows keeps one
-- definition of a deposit, a crypto wallet and a debt account. This file then
-- does the three things that only matter once they are all present:
--
--   1. every live account is in net worth and active, so no section is
--      silently missing from the header total,
--   2. the account `order` is fixed so the Bank / Cash / Savings / Deposit /
--      Crypto / Debt sections appear in the storyboard's order on one screen,
--   3. the exchange rates are re-stamped as fresh, because the header shows the
--      conversion timestamp next to the aggregated figure.
--
-- Applied on its own it is a safe no-op-ish normalisation, which is why its
-- self-test assertions check its effect rather than a row-count delta.

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
