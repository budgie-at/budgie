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
        INNER JOIN `instruments` AS `cash_instrument` ON `cash_instrument`.`id` = `cash`.`instrument_id` AND `cash_instrument`.`type` = 'FIAT'
        INNER JOIN `transactions` AS `trade` ON `trade`.`type` = 'TRANSFER' AND `trade`.`deleted_at` IS NULL
        INNER JOIN `transaction_entries` AS `trade_entry`
            ON `trade_entry`.`transaction_id` = `trade`.`id`
            AND `trade_entry`.`account_id` = `cash`.`id`
            AND `trade_entry`.`deleted_at` IS NULL
        INNER JOIN `accounts` AS `security`
            ON `security`.`id` IN (`trade`.`from_account_id`, `trade`.`to_account_id`)
            AND `security`.`id` != `cash`.`id`
            AND `security`.`integration_id` = `cash`.`integration_id`
        INNER JOIN `instruments` AS `security_instrument` ON `security_instrument`.`id` = `security`.`instrument_id` AND `security_instrument`.`type` != 'FIAT'
        WHERE `cash`.`type` = 'STOCKS'
            AND `cash`.`id` = COALESCE(`transactions`.`to_account_id`, `transactions`.`from_account_id`)
            AND (
                (
                    `cash`.`created_at` BETWEEN 1794541504 AND 1794583079
                    AND `transactions`.`created_at` = `cash`.`created_at`
                    AND `trade`.`operated_at` < `transactions`.`operated_at`
                )
                OR (
                    `transactions`.`operated_at` IN (`trade`.`operated_at`, `trade`.`operated_at` - 1)
                    AND `transactions`.`created_at` = `trade_entry`.`created_at`
                )
            )
    );
