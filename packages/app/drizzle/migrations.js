// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20261001084501_baseline/migration.sql';
import m0001 from './20261002214604_recurring_series/migration.sql';
import m0002 from './20261004064254_transaction_import_fingerprint/migration.sql';
import m0003 from './20261004090619_seed_account_deleted_transfer_category/migration.sql';
import m0004 from './20261004121613_transaction_tag_source/migration.sql';
import m0005 from './20261005210950_account_installment_count/migration.sql';
import m0006 from './20261007190655_transaction_entry_operation_metadata/migration.sql';
import m0007 from './20261011120000_ai_feature_settings/migration.sql';
import m0008 from './20261016150134_settings_onboarding/migration.sql';
import m0009 from './20261020195645_sync_balance_reconciliation/migration.sql';
import m0010 from './20261021184854_bank_integration_label/migration.sql';

  export default {
    migrations: {
      "20261001084501_baseline": m0000,
"20261002214604_recurring_series": m0001,
"20261004064254_transaction_import_fingerprint": m0002,
"20261004090619_seed_account_deleted_transfer_category": m0003,
"20261004121613_transaction_tag_source": m0004,
"20261005210950_account_installment_count": m0005,
"20261007190655_transaction_entry_operation_metadata": m0006,
"20261011120000_ai_feature_settings": m0007,
"20261016150134_settings_onboarding": m0008,
"20261020195645_sync_balance_reconciliation": m0009,
"20261021184854_bank_integration_label": m0010
}
  }
  