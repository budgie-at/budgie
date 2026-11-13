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
import m0010 from './20261024181034_clear_money_transfer_mcc_default_category/migration.sql';
import m0011 from './20261025051229_account_is_external/migration.sql';
import m0012 from './20261025062922_account_external_ids/migration.sql';
import m0013 from './20261026092451_bank_integration_label/migration.sql';
import m0014 from './20261027125204_transaction_receipts/migration.sql';
import m0015 from './20261028124502_binance_capital_pending_from/migration.sql';
import m0016 from './20261028143254_budget_period_snapshots/migration.sql';
import m0017 from './20261028144701_budget_rollover/migration.sql';
import m0018 from './20261029131908_dedupe_recurring_series/migration.sql';
import m0019 from './20261030001632_binance_multi_account_and_sync_error_code/migration.sql';
import m0020 from './20261031052517_budget_v3/migration.sql';
import m0021 from './20261031231028_category_icon_source/migration.sql';
import m0022 from './20261104170422_compact_rates_and_embeddings/migration.sql';
import m0023 from './20261105192451_recurring_smart_series/migration.sql';
import m0024 from './20261105193657_cloud_sync_identity/migration.sql';
import m0025 from './20261105193722_cloud_sync_seed_identity/migration.sql';
import m0026 from './20261106125437_inzhur_fund_instruments/migration.sql';
import m0027 from './20261106130000_cloud_sync_outbox_triggers/migration.sql';
import m0028 from './20261108010559_common_johnny_blaze/migration.sql';
import m0029 from './20261111113359_exotic_exiles/migration.sql';
import m0030 from './20261113083725_perfect_blink/migration.sql';
import m0031 from './20261113100108_yield_kind/migration.sql';
import m0032 from './20261113100109_yield_outbox_triggers/migration.sql';
import m0033 from './20261113125436_yield_tag_repair_version/migration.sql';

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
"20261024181034_clear_money_transfer_mcc_default_category": m0010,
"20261025051229_account_is_external": m0011,
"20261025062922_account_external_ids": m0012,
"20261026092451_bank_integration_label": m0013,
"20261027125204_transaction_receipts": m0014,
"20261028124502_binance_capital_pending_from": m0015,
"20261028143254_budget_period_snapshots": m0016,
"20261028144701_budget_rollover": m0017,
"20261029131908_dedupe_recurring_series": m0018,
"20261030001632_binance_multi_account_and_sync_error_code": m0019,
"20261031052517_budget_v3": m0020,
"20261031231028_category_icon_source": m0021,
"20261104170422_compact_rates_and_embeddings": m0022,
"20261105192451_recurring_smart_series": m0023,
"20261105193657_cloud_sync_identity": m0024,
"20261105193722_cloud_sync_seed_identity": m0025,
"20261106125437_inzhur_fund_instruments": m0026,
"20261106130000_cloud_sync_outbox_triggers": m0027,
"20261108010559_common_johnny_blaze": m0028,
"20261111113359_exotic_exiles": m0029,
"20261113083725_perfect_blink": m0030,
"20261113100108_yield_kind": m0031,
"20261113100109_yield_outbox_triggers": m0032,
"20261113125436_yield_tag_repair_version": m0033
}
  }
  