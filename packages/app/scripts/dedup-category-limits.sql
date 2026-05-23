-- Emergency dedup runbook for budget_category_limits.
-- Run this against a user's exported DB when migration 0025_budget_planning_followups.sql
-- fails with "UNIQUE constraint failed" on the partial index (Pre-Mortem Scenario 4).
-- This script DOES NOT hard-delete rows (preserves soft-delete invariant, principle 4).
-- It identifies offending pairs and suggests soft-deleting the older duplicate.

-- Step 1: identify pairs with multiple live rows.
SELECT budget_id, category_id, GROUP_CONCAT(id) AS row_ids, GROUP_CONCAT(created_at) AS created_ats
  FROM budget_category_limits
 WHERE deleted_at IS NULL
 GROUP BY budget_id, category_id
HAVING COUNT(*) > 1;

-- Step 2: for each offending pair, soft-delete the older duplicate.
-- (Keeps the most recently created row live; consolidates without violating soft-delete.)
-- Run support workflow: for each (budget_id, category_id) returned by step 1,
-- UPDATE budget_category_limits
--    SET deleted_at = strftime('%s','now')
--  WHERE budget_id = ? AND category_id = ? AND deleted_at IS NULL
--    AND id NOT IN (
--      SELECT id FROM budget_category_limits
--       WHERE budget_id = ? AND category_id = ? AND deleted_at IS NULL
--       ORDER BY created_at DESC LIMIT 1
--    );
