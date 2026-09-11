.read shared/long-history.sql
.read shared/bank-sync-connected.sql
.read shared/bank-fees.sql

-- Bank Fees & Charges must read as a spending category on the analytics first screen.
-- A fee on the income row would also surface under Income, so drop it and lift the
-- expense/transfer fees above the other spending rows.
DELETE FROM transaction_entries WHERE id = 23022;
UPDATE transaction_entries SET amount = amount * 45 WHERE id IN (23002, 23012, 23032, 23042);
