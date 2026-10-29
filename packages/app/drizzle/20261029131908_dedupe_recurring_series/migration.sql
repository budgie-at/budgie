UPDATE `recurring_series`
SET `deleted_at` = unixepoch(), `updated_at` = unixepoch()
WHERE `deleted_at` IS NULL
    AND `id` NOT IN (
        SELECT `id`
        FROM (
            SELECT `id`,
                ROW_NUMBER() OVER (
                    PARTITION BY `kind`, `merchant_key`, `period_days`
                    ORDER BY `user_state` = 'SUGGESTED', `id`
                ) AS `rank`
            FROM `recurring_series`
            WHERE `deleted_at` IS NULL
        )
        WHERE `rank` = 1
    );
