CREATE TABLE IF NOT EXISTS `bank_integrations` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
    `deleted_at` integer,
    `provider` text NOT NULL,
    `token` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `bank_integrations_provider_token_unq`
ON `bank_integrations` (`provider`, `token`)
WHERE `deleted_at` IS NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO bank_integrations (created_at, updated_at, provider, token)
SELECT
    MIN(bank_syncs.created_at),
    MAX(bank_syncs.updated_at),
    bank_syncs.provider,
    bank_syncs.token
FROM bank_syncs
INNER JOIN accounts
    ON accounts.id = bank_syncs.account_id
    AND accounts.deleted_at IS NULL
WHERE bank_syncs.deleted_at IS NULL
  AND trim(bank_syncs.token) != ''
GROUP BY bank_syncs.provider, bank_syncs.token;
--> statement-breakpoint
ALTER TABLE `accounts` ADD COLUMN `integration_id` integer REFERENCES bank_integrations(id) ON DELETE set null;
--> statement-breakpoint
UPDATE accounts
SET integration_id = (
    SELECT bank_integrations.id
    FROM bank_syncs
    INNER JOIN bank_integrations
        ON bank_integrations.provider = bank_syncs.provider
        AND bank_integrations.token = bank_syncs.token
        AND bank_integrations.deleted_at IS NULL
    WHERE bank_syncs.account_id = accounts.id
      AND bank_syncs.deleted_at IS NULL
      AND trim(bank_syncs.token) != ''
)
WHERE accounts.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM bank_syncs
      WHERE bank_syncs.account_id = accounts.id
        AND bank_syncs.deleted_at IS NULL
        AND trim(bank_syncs.token) != ''
  );
