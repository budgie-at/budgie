ALTER TABLE `transaction_tags` ADD COLUMN `is_primary` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_tags_primary_idx` ON `transaction_tags` (`transaction_id`) WHERE `is_primary` = 1;
--> statement-breakpoint
-- backfill: lowest tag_id per transaction becomes primary
UPDATE transaction_tags
SET is_primary = 1
WHERE (transaction_id, tag_id) IN (
    SELECT transaction_id, MIN(tag_id)
    FROM transaction_tags
    GROUP BY transaction_id
);
