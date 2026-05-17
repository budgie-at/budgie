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

--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '0780';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3000';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3001';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3002';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3003';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3004';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3005';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3006';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3007';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3008';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3009';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3010';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3011';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3012';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3013';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3014';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3015';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3016';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3017';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3018';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3019';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3020';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3021';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3022';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3023';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3024';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3025';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3026';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3027';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3028';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3029';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3030';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3031';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3032';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3033';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3034';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3035';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3036';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3037';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3038';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3039';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3040';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3041';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3042';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3043';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3044';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3045';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3046';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3047';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3048';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3049';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3050';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3051';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3052';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3053';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3054';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3055';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3056';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3057';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3058';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3059';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3060';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3061';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3062';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3063';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3064';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3065';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3066';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3067';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3068';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3069';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3070';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3071';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3072';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3073';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3074';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3075';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3076';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3077';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3078';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3079';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3080';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3081';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3082';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3083';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3084';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3085';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3086';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3087';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3088';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3089';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3090';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3091';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3092';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3093';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3094';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3095';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3096';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3097';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3098';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3099';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3100';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3101';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3102';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3103';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3104';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3105';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3106';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3107';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3108';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3109';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3110';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3111';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3112';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3113';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3114';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3115';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3116';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3117';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3118';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3119';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3120';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3121';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3122';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3123';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3124';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3125';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3126';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3127';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3128';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3129';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3130';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3131';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3132';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3133';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3134';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3135';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3136';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3137';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3138';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3139';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3140';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3141';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3142';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3143';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3144';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3145';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3146';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3147';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3148';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3149';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3150';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3151';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3152';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3153';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3154';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3155';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3156';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3157';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3158';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3159';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3160';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3161';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3162';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3163';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3164';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3165';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3166';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3167';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3168';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3169';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3170';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3171';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3172';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3173';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3174';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3175';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3176';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3177';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3178';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3179';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3180';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3181';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3182';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3183';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3184';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3185';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3186';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3187';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3188';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3189';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3190';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3191';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3192';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3193';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3194';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3195';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3196';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3197';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3198';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3199';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3200';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3201';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3202';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3203';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3204';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3205';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3206';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3207';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3208';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3209';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3210';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3211';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3212';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3213';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3214';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3215';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3216';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3217';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3218';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3219';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3220';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3221';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3222';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3223';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3224';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3225';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3226';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3227';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3228';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3229';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3230';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3231';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3232';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3233';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3234';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3235';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3236';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3237';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3238';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3239';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3240';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3241';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3242';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3243';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3244';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3245';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3246';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3247';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3248';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3249';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3250';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3251';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3252';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3253';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3254';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3255';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3256';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3257';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3258';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3259';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3260';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3261';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3262';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3263';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3264';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3265';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3266';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3267';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3268';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3269';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3270';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3271';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3272';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3273';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3274';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3275';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3276';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3277';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3278';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3279';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3280';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3281';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3282';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3283';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3284';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3285';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3286';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3287';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3288';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3289';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3290';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3291';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3292';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3293';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3294';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3295';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3296';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3297';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3298';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3299';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3300';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3301';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3302';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3351';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3352';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3353';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3354';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3355';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3356';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3357';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3358';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3359';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3360';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3361';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3362';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3363';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3364';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3365';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3366';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3367';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3368';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3369';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3370';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3371';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3372';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3373';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3374';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3375';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3376';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3377';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3378';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3379';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3380';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3381';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3382';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3383';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3384';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3385';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3386';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3387';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3388';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3389';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3390';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3391';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3392';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3393';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3394';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3395';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3396';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3397';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3398';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3399';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3400';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3401';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3402';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3403';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3404';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3405';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3406';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3407';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3408';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3409';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3410';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3411';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3412';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3413';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3414';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3415';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3416';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3417';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3418';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3419';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3420';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3421';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3422';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3423';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3424';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3425';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3426';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3427';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3428';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3429';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3430';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3431';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3432';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3433';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3434';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3435';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3436';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3437';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3438';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3439';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3440';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3441';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3501';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3502';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3503';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3504';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3505';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3506';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3507';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3508';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3509';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3510';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3511';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3512';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3513';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3514';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3515';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3516';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3517';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3518';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3519';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3520';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3521';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3522';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3523';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3524';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3525';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3526';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3527';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3528';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3529';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3530';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3531';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3532';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3533';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3534';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3535';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3536';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3537';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3538';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3539';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3540';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3541';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3542';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3543';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3544';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3545';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3546';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3547';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3548';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3549';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3550';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3551';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3552';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3553';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3554';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3555';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3556';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3557';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3558';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3559';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3560';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3561';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3562';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3563';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3564';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3565';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3566';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3567';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3568';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3569';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3570';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3571';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3572';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3573';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3574';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3575';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3576';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3577';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3578';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3579';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3580';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3581';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3582';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3583';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3584';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3585';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3586';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3587';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3588';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3589';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3590';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3591';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3592';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3593';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3594';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3595';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3596';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3597';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3598';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3599';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3600';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3601';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3602';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3603';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3604';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3605';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3606';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3607';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3608';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3609';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3610';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3611';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3612';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3613';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3614';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3615';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3616';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3617';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3618';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3619';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3620';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3621';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3622';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3623';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3624';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3625';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3626';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3627';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3628';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3629';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3630';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3631';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3632';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3633';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3634';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3635';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3636';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3637';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3638';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3639';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3640';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3641';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3642';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3643';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3644';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3645';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3646';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3647';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3648';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3649';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3650';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3651';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3652';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3653';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3654';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3655';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3656';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3657';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3658';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3659';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3660';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3661';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3662';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3663';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3664';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3665';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3666';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3667';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3668';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3669';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3670';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3671';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3672';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3673';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3674';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3675';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3676';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3677';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3678';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3679';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3680';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3681';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3682';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3683';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3684';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3685';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3686';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3687';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3688';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3689';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3690';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3691';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3692';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3693';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3694';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3695';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3696';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3697';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3698';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3699';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3700';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3701';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3702';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3703';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3704';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3705';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3706';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3707';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3708';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3709';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3710';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3711';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3712';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3713';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3714';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3715';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3716';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3717';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3718';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3719';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3720';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3721';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3722';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3723';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3724';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3725';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3726';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3727';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3728';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3729';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3730';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3731';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3732';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3733';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3734';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3735';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3736';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3737';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3738';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3739';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3740';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3741';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3742';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3743';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3744';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3745';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3746';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3747';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3748';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3749';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3750';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3751';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3752';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3753';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3754';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3755';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3756';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3757';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3758';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3759';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3760';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3761';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3762';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3763';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3764';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3765';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3766';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3767';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3768';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3769';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3770';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3771';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3772';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3773';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3774';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3775';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3776';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3777';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3778';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3779';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3780';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3781';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3782';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3783';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3784';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3785';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3786';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3787';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3788';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3789';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3790';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3791';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3792';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3793';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3794';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3795';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3796';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3797';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3798';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3799';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3800';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3801';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3802';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3803';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3804';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3805';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3806';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3807';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3808';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3809';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3810';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3811';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3812';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3813';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3814';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3815';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3816';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3817';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3818';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3819';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3820';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3821';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3822';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3823';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3824';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3825';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3826';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3827';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3828';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3829';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3830';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3831';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3832';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3833';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3834';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3835';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3836';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3837';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3838';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '3882';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4011';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4112';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4119';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4411';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4457';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4468';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4582';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4723';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4729';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4761';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4812';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4813';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4814';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4815';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4816';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4821';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4829';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '4899';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5013';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5021';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5039';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5044';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5045';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5047';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5065';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5072';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5074';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5094';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5099';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5111';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5131';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5137';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5139';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5172';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5192';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Gifts & Donations' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5193';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5198';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5199';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5200';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5211';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5231';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5251';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5261';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5262';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5271';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5297';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5298';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5299';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5300';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5309';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5399';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5422';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5441';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5451';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5462';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5499';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5511';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5521';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5531';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5561';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5571';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5592';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5598';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5599';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5611';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5621';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5631';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5641';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5681';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5697';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5698';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5718';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5733';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5735';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Restaurants & Cafes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5811';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Restaurants & Cafes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5813';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5815';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5816';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5817';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5818';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5832';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5931';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5932';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5933';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5935';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5937';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5946';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5949';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5950';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Insurance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5960';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5961';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5962';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5963';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5964';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5965';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5966';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5967';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5969';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5970';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5971';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5972';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5973';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5974';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5975';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5976';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5978';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5983';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5993';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Education' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5994';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5996';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5997';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '5998';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6012';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6022';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6023';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6025';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6026';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6028';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6050';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6051';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Investments' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6211';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6236';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Insurance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6381';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Housing & Utilities' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6513';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6529';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6530';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6531';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6532';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6533';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6534';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6535';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6536';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6537';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6538';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6539';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6540';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6611';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Investments' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '6760';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7012';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7032';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7033';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7217';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7221';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7251';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7273';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7277';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Shopping' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7278';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7280';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Family & Kids' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7295';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7296';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7297';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7311';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7321';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Bank Fees & Charges' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7322';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7332';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7333';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7338';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7339';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7342';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7361';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7372';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7375';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7379';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7389';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7392';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7393';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7394';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Personal Care' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7395';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7399';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7512';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7513';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Travel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7519';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7524';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7535';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7549';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Electronics & Gadgets' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7622';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7623';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7629';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Clothing & Accessories' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7631';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7641';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7692';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Home Maintenance' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7699';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7800';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7801';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7802';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7829';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7833';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7932';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7933';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Sport & Fitness' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7992';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7993';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7994';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '7995';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8044';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Health & Medical' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8071';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8110';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8111';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Gifts & Donations' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8641';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Gifts & Donations' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8651';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Gifts & Donations' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8661';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Transportation' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8675';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Subscriptions' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8699';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8734';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8743';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8911';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8931';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Business Expenses' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '8999';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Taxes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9311';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Taxes' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9399';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9406';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Debt Payments' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9411';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Groceries' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9751';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Car & Fuel' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9752';
--> statement-breakpoint
UPDATE `mcc_categories` SET `default_category_id` = (SELECT `id` FROM `categories` WHERE `title` = 'Entertainment' AND `is_default` = 1 AND `is_system_category` = 0) WHERE `mcc` = '9754';

--> statement-breakpoint
ALTER TABLE `settings` ADD `apply_mcc_default_category` integer DEFAULT true NOT NULL;

--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `category_source` text DEFAULT 'USER' NOT NULL;