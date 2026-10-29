UPDATE `recurring_series`
SET `deleted_at` = unixepoch(), `updated_at` = unixepoch()
WHERE `deleted_at` IS NULL
    AND `user_state` = 'SUGGESTED'
    AND `updated_at` = `created_at`
    AND EXISTS (
        SELECT 1
        FROM `recurring_series` AS `twin`
        WHERE `twin`.`deleted_at` IS NULL
            AND `twin`.`id` <> `recurring_series`.`id`
            AND `twin`.`kind` = `recurring_series`.`kind`
            AND `twin`.`merchant_key` = `recurring_series`.`merchant_key`
            AND `twin`.`period_days` = `recurring_series`.`period_days`
            AND `twin`.`title` = `recurring_series`.`title`
            AND (
                `twin`.`user_state` <> 'SUGGESTED'
                OR `twin`.`updated_at` <> `twin`.`created_at`
                OR `twin`.`id` < `recurring_series`.`id`
            )
    );
