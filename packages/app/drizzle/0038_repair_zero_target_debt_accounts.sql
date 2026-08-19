UPDATE accounts
SET target_balance = (
    SELECT debt_events.amount
    FROM debt_events
    WHERE debt_events.debt_account_id = accounts.id
      AND debt_events.direction = 'OPEN'
      AND debt_events.deleted_at IS NULL
    ORDER BY debt_events.operated_at ASC
    LIMIT 1
)
WHERE accounts.type = 'DEBT'
  AND accounts.target_balance = 0
  AND EXISTS (
    SELECT 1
    FROM debt_events
    WHERE debt_events.debt_account_id = accounts.id
      AND debt_events.direction = 'OPEN'
      AND debt_events.deleted_at IS NULL
  );
