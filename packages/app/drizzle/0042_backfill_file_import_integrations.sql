CREATE UNIQUE INDEX IF NOT EXISTS `bank_integrations_provider_file_import_unq`
ON `bank_integrations` (`provider`)
WHERE `token` = '' AND `deleted_at` IS NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO bank_integrations (created_at, updated_at, provider, token)
SELECT
    MIN(bank_syncs.created_at),
    MAX(bank_syncs.updated_at),
    bank_syncs.provider,
    ''
FROM bank_syncs
INNER JOIN accounts
    ON accounts.id = bank_syncs.account_id
    AND accounts.deleted_at IS NULL
WHERE bank_syncs.deleted_at IS NULL
  AND accounts.integration_id IS NULL
GROUP BY bank_syncs.provider;
--> statement-breakpoint
UPDATE accounts
SET integration_id = (
    SELECT bank_integrations.id
    FROM bank_syncs
    INNER JOIN bank_integrations
        ON bank_integrations.provider = bank_syncs.provider
        AND bank_integrations.token = ''
        AND bank_integrations.deleted_at IS NULL
    WHERE bank_syncs.account_id = accounts.id
      AND bank_syncs.deleted_at IS NULL
)
WHERE accounts.deleted_at IS NULL
  AND accounts.integration_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM bank_syncs
      WHERE bank_syncs.account_id = accounts.id
        AND bank_syncs.deleted_at IS NULL
  );
