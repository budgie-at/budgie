-- Marks legacy manual-brokerage opening and trade funding adjustments as system funding so the app can resize them.
UPDATE `transactions`
SET `external_source` = 'BROKERAGE_FUNDING'
WHERE `type` = 'ADJUSTMENT'
    AND `external_source` IS NULL
    AND `deleted_at` IS NULL
    AND EXISTS (
        SELECT 1
        FROM `accounts` AS `cash`
        INNER JOIN `bank_integrations` ON `bank_integrations`.`id` = `cash`.`integration_id` AND `bank_integrations`.`provider` = 'MANUAL'
        INNER JOIN `instruments` ON `instruments`.`id` = `cash`.`instrument_id` AND `instruments`.`type` = 'FIAT'
        WHERE `cash`.`id` = COALESCE(`transactions`.`to_account_id`, `transactions`.`from_account_id`)
            AND (
                `transactions`.`created_at` = `cash`.`created_at`
                OR `transactions`.`operated_at` = `cash`.`created_at`
                OR EXISTS (
                    SELECT 1
                    FROM `transactions` AS `trade`
                    INNER JOIN `accounts` AS `security`
                        ON `security`.`id` IN (`trade`.`from_account_id`, `trade`.`to_account_id`)
                        AND `security`.`id` != `cash`.`id`
                        AND `security`.`integration_id` = `cash`.`integration_id`
                    WHERE `trade`.`type` = 'TRANSFER'
                        AND `trade`.`deleted_at` IS NULL
                        AND `cash`.`id` IN (`trade`.`from_account_id`, `trade`.`to_account_id`)
                        AND `transactions`.`operated_at` IN (`trade`.`operated_at`, `trade`.`operated_at` - 1)
                )
            )
    );
