ALTER TABLE `mcc_categories` ADD `default_category_id` integer REFERENCES categories(id) ON DELETE SET NULL;
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Pets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '0742';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1520';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1711';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1731';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1740';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1750';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1761';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1771';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '1799';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4111';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4121';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4131';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4214';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4215';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4511';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4722';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4784';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4789';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4900';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5122';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5310';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5311';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5331';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5411';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5532';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5533';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5541';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5542';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5552';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5651';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5655';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5661';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5691';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5699';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5712';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5713';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5714';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5719';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5722';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5732';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5734';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Restaurants & Cafes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5812';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Restaurants & Cafes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5814';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5912';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5921';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5940';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5941';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5942';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5943';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5944';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Family & Kids' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5945';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5947';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5948';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5968';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5977';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5992';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Pets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5995';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5999';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Insurance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6300';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Insurance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6399';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7011';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7210';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7211';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7216';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7230';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Taxes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7276';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7298';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7349';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7511';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7523';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7531';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7534';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7538';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7542';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7832';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7841';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7911';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7922';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7929';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7941';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7991';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7996';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7997';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7998';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7999';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8011';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8021';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8031';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8041';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8042';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8043';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8049';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8050';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8062';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8099';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8211';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8220';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8241';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8244';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8249';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8299';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Family & Kids' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8351';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Gifts & Donations' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8398';
