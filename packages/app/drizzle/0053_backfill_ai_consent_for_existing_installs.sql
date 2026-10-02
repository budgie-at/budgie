UPDATE `settings`
SET `is_ai_enabled` = 1,
    `updated_at` = unixepoch()
WHERE `is_ai_enabled` = 0
  AND (
      `is_onboarding_completed` = 1
      OR `onboarding_step` > 0
      OR EXISTS (SELECT 1 FROM `accounts` WHERE `accounts`.`deleted_at` IS NULL)
      OR EXISTS (SELECT 1 FROM `transactions` WHERE `transactions`.`deleted_at` IS NULL)
  );
