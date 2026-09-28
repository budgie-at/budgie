-- Restores MCC 6011 on Monobank ATM withdrawals imported before mcc_categories was seeded; their ATM fee stays folded into the amount.
UPDATE transaction_entries
SET mcc_category_id = (SELECT id FROM mcc_categories WHERE mcc = '6011'),
    updated_at = unixepoch()
WHERE mcc_category_id IS NULL
    AND type = 'CREDIT'
    AND category_source != 'FEE'
    AND EXISTS (SELECT 1 FROM mcc_categories WHERE mcc = '6011')
    AND transaction_id IN (SELECT id FROM transactions WHERE external_source = 'MONOBANK' AND title LIKE 'Банкомат %');
