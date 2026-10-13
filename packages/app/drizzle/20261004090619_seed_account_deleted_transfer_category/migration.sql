INSERT OR IGNORE INTO `categories` (`id`, `is_default`, `title`, `title_search`, `icon`, `parent_id`, `is_system_category`)
VALUES
    (300000, true, 'Transfer (account deleted)', 'transfer (account deleted)', 'ArrowLeftRight', NULL, true);
--> statement-breakpoint
INSERT OR IGNORE INTO `default_category_translations` (`category_id`, `language`, `title`)
SELECT 300000, translation.column1, translation.column2
FROM (
    VALUES
        ('en', 'Transfer (account deleted)'),
        ('uk', 'Переказ (рахунок видалено)'),
        ('de', 'Überweisung (Konto gelöscht)'),
        ('es', 'Transferencia (cuenta eliminada)'),
        ('fr', 'Virement (compte supprimé)')
) AS translation
WHERE EXISTS (SELECT 1 FROM `categories` WHERE `id` = 300000 AND `is_system_category` = 1);
