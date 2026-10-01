-- Seeds the tracked-elsewhere cash withdrawal system category and assigns it to the Monobank ATM withdrawals restored by 0067.
INSERT OR IGNORE INTO `categories` (`id`, `is_default`, `title`, `title_search`, `icon`, `parent_id`, `is_system_category`)
VALUES
    (200000, true, 'Cash withdrawal (tracked elsewhere)', 'cash withdrawal (tracked elsewhere)', 'Banknote', NULL, true);
--> statement-breakpoint
INSERT OR IGNORE INTO `default_category_translations` (`category_id`, `language`, `title`) VALUES
(200000, 'en', 'Cash withdrawal (tracked elsewhere)'),
(200000, 'uk', 'Зняття готівки (враховано окремо)'),
(200000, 'de', 'Bargeldabhebung (separat erfasst)'),
(200000, 'es', 'Retiro de efectivo (registrado aparte)'),
(200000, 'fr', 'Retrait d''espèces (suivi ailleurs)');
--> statement-breakpoint
UPDATE transaction_entries
SET category_id = 200000,
    category_source = 'USER',
    updated_at = unixepoch()
WHERE mcc_category_id IS NULL
  AND category_id IS NULL
  AND type = 'CREDIT'
  AND category_source != 'FEE'
  AND deleted_at IS NULL
  AND original_transaction_id IS NULL
  AND created_at < (SELECT MIN(created_at) FROM mcc_categories)
  AND EXISTS (SELECT 1 FROM categories WHERE id = 200000 AND is_system_category = 1 AND deleted_at IS NULL)
  AND transaction_id IN (
      SELECT id
      FROM transactions
      WHERE external_source = 'MONOBANK'
        AND title LIKE 'Банкомат %'
        AND type = 'EXPENSE'
        AND deleted_at IS NULL
        AND consolidation_parent_transaction_id IS NULL
  );
