ALTER TABLE `transactions` ADD `applied_rule_id` integer REFERENCES `rules`(`id`);
