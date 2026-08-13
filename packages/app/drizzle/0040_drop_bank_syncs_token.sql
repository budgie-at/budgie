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
  AND integration_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM bank_syncs
      WHERE bank_syncs.account_id = accounts.id
        AND bank_syncs.deleted_at IS NULL
        AND trim(bank_syncs.token) != ''
  );
--> statement-breakpoint
ALTER TABLE `bank_syncs` DROP COLUMN `token`;
