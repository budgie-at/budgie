-- Slice B: switch to partial unique index so soft-deleted tombstones do not block re-add.
-- No dedup statement is added: (a) the old full-unique index was active, so live duplicates
-- cannot exist in well-formed DBs; (b) hard-deleting rows would violate the soft-delete
-- invariant (principle 4). If existing data violates the new constraint, CREATE INDEX
-- fails loudly — the migration aborts and an emergency support workflow is required
-- (see scripts/dedup-category-limits.sql).
DROP INDEX IF EXISTS `budget_category_limit_budget_category_unq`;--> statement-breakpoint
CREATE UNIQUE INDEX `budget_category_limit_budget_category_unq` ON `budget_category_limits` (`budget_id`,`category_id`) WHERE `deleted_at` IS NULL;
