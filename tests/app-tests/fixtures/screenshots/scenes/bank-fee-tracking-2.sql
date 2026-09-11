.read shared/long-history.sql
.read shared/bank-sync-connected.sql
.read shared/bank-fees.sql

-- Lift the fee entries so Bank Fees & Charges ranks on the analytics first screen.
UPDATE transaction_entries SET amount = amount * 12 WHERE id IN (23002, 23012, 23022, 23032, 23042);
