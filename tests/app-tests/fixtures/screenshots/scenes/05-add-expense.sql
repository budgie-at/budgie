-- Seeds untagged now-anchored expense patterns in the locale's currency so one tap on the suggested category also fills the amount.

.read shared/pattern-category-now.sql

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1800 AND 1899;

UPDATE transaction_entries
SET amount = (
    SELECT CAST(ROUND(transaction_entries.amount * CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END
        / CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END) * CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS INTEGER)
    FROM settings
)
WHERE transaction_id BETWEEN 1800 AND 1899;
