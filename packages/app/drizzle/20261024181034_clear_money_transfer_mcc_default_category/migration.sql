UPDATE `transaction_entries`
SET `category_id` = NULL, `category_source` = 'USER'
WHERE `category_source` = 'MCC_DEFAULT'
    AND `category_id` = 32
    AND `deleted_at` IS NULL
    AND `mcc_category_id` IN (SELECT `id` FROM `mcc_categories` WHERE `mcc` = '4829');
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = NULL WHERE `mcc` = '4829' AND `default_category_id` = 32;
