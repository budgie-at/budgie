INSERT OR IGNORE INTO `categories` (`id`, `is_default`, `title`, `title_search`, `icon`, `parent_id`, `is_system_category`)
VALUES
    (100000, true, 'Lending',   'lending',   'HandCoins', NULL, true),
    (100001, true, 'Borrowing', 'borrowing', 'Handshake', NULL, true);
--> statement-breakpoint
INSERT OR IGNORE INTO `default_category_translations` (`category_id`, `language`, `title`) VALUES
(100000, 'en', 'Lending'),
(100000, 'uk', 'Надані позики'),
(100000, 'de', 'Verliehenes Geld'),
(100000, 'es', 'Préstamos Concedidos'),
(100000, 'fr', 'Prêts Accordés'),
(100001, 'en', 'Borrowing'),
(100001, 'uk', 'Отримані позики'),
(100001, 'de', 'Geliehenes Geld'),
(100001, 'es', 'Préstamos Recibidos'),
(100001, 'fr', 'Emprunts');
