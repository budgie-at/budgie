UPDATE `categories`
SET `sync_id` = CASE `id`
    WHEN 1 THEN '5d952935-83a2-57f0-82af-f1defa01a778'
    WHEN 2 THEN 'b226f10e-de8f-51c2-801b-c8793eeba178'
    WHEN 3 THEN '9e3735ea-4783-5a36-b2d6-bc06f5743cb7'
    WHEN 4 THEN '9ef5d3a9-1df5-555e-85a6-d11a1ca759e5'
    WHEN 5 THEN '9053e27d-3103-5300-b2a9-23215b1ff99c'
    WHEN 6 THEN '70a5af43-7bbf-5fa8-80c7-c3bfd99637c6'
    WHEN 7 THEN 'db3f8ec9-0266-5d0a-96af-126c000eef06'
    WHEN 8 THEN '66d916f2-6c04-50a0-ac3c-2dbf19288b7e'
    WHEN 9 THEN '007b418d-cc51-5068-92cf-09a01220a707'
    WHEN 10 THEN '6081498f-2370-5947-ba05-79c2005c1f02'
    WHEN 11 THEN '33733094-003f-5e8e-8661-87ec1021a118'
    WHEN 12 THEN 'a50bf254-5b11-5a59-91e7-21e68599d91f'
    WHEN 13 THEN '16557cf5-3acf-5037-b6ca-b44f3e1137ea'
    WHEN 14 THEN 'a3273aa4-4586-5eb5-a9ac-f5f2dbe43a90'
    WHEN 15 THEN '9e54a242-027d-580b-b244-326384055a88'
    WHEN 16 THEN '9aaaae5b-66b6-5180-bc76-f371aaaa95b7'
    WHEN 17 THEN 'cfd28341-9187-5fad-8cc2-e658e423d5ac'
    WHEN 18 THEN '4af40ef5-ce08-58b4-865d-06262ad3ec96'
    WHEN 19 THEN '2c48a56c-c1ae-5ff7-b287-6539c7b0a230'
    WHEN 20 THEN '7887105d-d7b2-5ffc-a833-13443d57abab'
    WHEN 21 THEN '86d82556-9a38-5551-bb26-c81e63c318b7'
    WHEN 22 THEN '255d6882-698e-5fab-89c7-2e29c683ed5f'
    WHEN 23 THEN '329b8df0-1b4f-5b73-b658-75a15a89e02f'
    WHEN 24 THEN '799576e7-f11f-5fb7-88e9-48ee398ee754'
    WHEN 25 THEN '6d8144f1-86dc-546d-909b-fb6738019aff'
    WHEN 26 THEN 'd8747e11-45a8-5c62-b66b-f51ce041f953'
    WHEN 27 THEN '826fc687-1fcc-5ad3-9bbf-d7a697ad1bef'
    WHEN 28 THEN '24b89b8c-9278-5af4-8894-04bf865e159e'
    WHEN 29 THEN '7de89b42-ffdd-5cd6-9b4d-3454cf1305c2'
    WHEN 30 THEN 'aa328c40-68cf-5b8c-8496-17278776aa2b'
    WHEN 31 THEN 'e791d03a-b565-50ce-a13b-c337166918de'
    WHEN 32 THEN '897706f0-71b4-561a-b763-a5111d17408c'
    WHEN 33 THEN '60874480-d49d-5bba-a10e-0c9683f120dc'
    WHEN 34 THEN '5d151f45-5f47-561c-b0a5-82fec6237e23'
    WHEN 35 THEN '792537f1-9c7e-553b-92f6-35ffd50c5d97'
    WHEN 36 THEN '40b13d41-529a-5f79-816c-390b31c04454'
    WHEN 37 THEN '2554aa7c-bdc5-5deb-b90d-c5147a9a318f'
    WHEN 38 THEN 'ecf021fa-12a6-5db9-8855-eec1a141424f'
    WHEN 39 THEN 'f285f3ed-3a76-58e5-be9e-f531fdbd7560'
    WHEN 100000 THEN 'e66bb383-224d-52c9-9034-1708ce3f3069'
    WHEN 100001 THEN '1fcdb051-39bd-5c86-b818-07b97adc9e22'
    WHEN 200000 THEN '83f44b32-de0f-56f4-ad2b-6ab4fe2f5d48'
    WHEN 300000 THEN 'd9b5a576-51fb-5c24-bb22-c10a3fa810c7'
END
WHERE `is_default` = 1 AND `sync_id` IS NULL;
--> statement-breakpoint
UPDATE `transaction_entries`
SET `sequence` = (
    SELECT COUNT(*)
    FROM `transaction_entries` AS `earlier`
    WHERE `earlier`.`transaction_id` = `transaction_entries`.`transaction_id` AND `earlier`.`id` < `transaction_entries`.`id`
);
--> statement-breakpoint
INSERT OR IGNORE INTO `sync_apply_state` (`id`, `is_applying`) VALUES (1, 0);
