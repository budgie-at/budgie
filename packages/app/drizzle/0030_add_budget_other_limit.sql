ALTER TABLE `budgets` ADD `other_limit` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `budgets`
SET `other_limit` = MAX(
    0,
    `overall_limit` - COALESCE(
        (
            SELECT SUM(`limit_amount`)
            FROM `budget_category_limits`
            WHERE `budget_category_limits`.`budget_id` = `budgets`.`id`
              AND `budget_category_limits`.`deleted_at` IS NULL
        ),
        0
    )
)
WHERE `deleted_at` IS NULL;
