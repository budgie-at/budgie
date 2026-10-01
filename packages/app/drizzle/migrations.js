import m0000 from './20251226214824_normal_dragon_man/migration.sql';
import m0001 from './20251231150737_late_red_wolf/migration.sql';
import m0002 from './20260101160630_dark_prima/migration.sql';
import m0003 from './20260102130718_unusual_maestro/migration.sql';
import m0004 from './20260102133539_cloudy_juggernaut/migration.sql';
import m0005 from './20260103202646_omniscient_jasper_sitwell/migration.sql';
import m0006 from './20260104090857_nice_warlock/migration.sql';
import m0007 from './20260131075924_pretty_puck/migration.sql';
import m0008 from './20260131083253_breezy_darkhawk/migration.sql';
import m0009 from './20260131174638_fine_molten_man/migration.sql';
import m0010 from './20260205211701_light_loa/migration.sql';
import m0011 from './20260206065349_windy_lyja/migration.sql';
import m0012 from './20260207213320_smooth_hedge_knight/migration.sql';
import m0013 from './20260212075803_fat_wild_child/migration.sql';
import m0014 from './20260222112655_light_calypso/migration.sql';
import m0015 from './20260414200000_add_entry_exchange_rate_and_to_iban/migration.sql';
import m0016 from './20260419000000_add_needs_embedding/migration.sql';
import m0017 from './20260421123659_drop_unused_fts_tables/migration.sql';
import m0018 from './20260424153714_add_transaction_tags_is_primary/migration.sql';
import m0019 from './20260426070408_add_consolidation_ledger/migration.sql';
import m0020 from './20260501005500_add_rules/migration.sql';
import m0021 from './20260501005640_add_updated_by/migration.sql';
import m0022 from './20260518000000_add_uncategorized_transaction_indexes/migration.sql';
import m0023 from './20260519000000_add_mcc_default_category/migration.sql';
import m0024 from './20260519000140_default_category_translations/migration.sql';
import m0025 from './20260519000320_add_consolidation_query_indexes/migration.sql';
import m0026 from './20260519000500_money_data_upgrade/migration.sql';
import m0027 from './20260603174000_mark_fee_entries/migration.sql';
import m0028 from './20260604094000_add_crypto_instruments/migration.sql';
import m0029 from './20260605150000_add_instrument_market_data_jobs/migration.sql';
import m0030 from './20260606094000_seed_top_crypto_market_prices/migration.sql';
import m0031 from './20260607094000_add_account_lookup_indexes/migration.sql';
import m0032 from './20260607094001_add_budget_planning/migration.sql';
import m0033 from './20260612094000_add_transaction_entry_kind/migration.sql';
import m0034 from './20260619112000_add_debt_target_base_valuation/migration.sql';
import m0035 from './20260708190000_add_debt_events/migration.sql';
import m0036 from './20260715160000_repair_borrowed_debt_migration/migration.sql';
import m0037 from './20260731121320_repair_invalid_account_ibans/migration.sql';
import m0038 from './20260801160000_repair_zero_target_debt_accounts/migration.sql';
import m0039 from './20260806070640_add_bank_integrations/migration.sql';
import m0040 from './20260807105320_drop_bank_syncs_token/migration.sql';
import m0041 from './20260808144000_add_deposit_account_fields/migration.sql';
import m0042 from './20260809182640_backfill_file_import_integrations/migration.sql';
import m0043 from './20260810221320_update_default_account_icons/migration.sql';
import m0044 from './20260812020000_categorize_debt_settlement_expenses/migration.sql';
import m0045 from './20260813054640_add_transaction_entry_quote/migration.sql';
import m0046 from './20260814093320_repoint_debt_event_entries/migration.sql';
import m0047 from './20260815132000_repair_double_counted_manual_debt_events/migration.sql';
import m0048 from './20260816170640_repair_cross_instrument_debt_events/migration.sql';
import m0049 from './20260817205320_add_bank_sync_backward_limit/migration.sql';
import m0050 from './20260817205320_add_onboarding_completed/migration.sql';
import m0051 from './20260819004000_add_onboarding_step_and_ai_consent/migration.sql';
import m0052 from './20260820042640_soft_cerebro/migration.sql';
import m0053 from './20260821081320_backfill_ai_consent_for_existing_installs/migration.sql';
import m0054 from './20260822120000_drop_runway_widget_setting/migration.sql';
import m0055 from './20260915094359_add_runway_settings/migration.sql';
import m0056 from './20260916035127_marvelous_menace/migration.sql';
import m0057 from './20260916204027_add_debt_system_categories/migration.sql';
import m0058 from './20260919203320_debt_v2_money_legs/migration.sql';
import m0059 from './20260923190144_add_monobank_setup_balance/migration.sql';
import m0060 from './20260924213051_round_debt_event_micro_units/migration.sql';
import m0061 from './20260927184706_round_transfer_micro_units/migration.sql';
import m0062 from './20260928045508_backfill_monobank_atm_mcc/migration.sql';
import m0063 from './20260928111005_fix_transfer_and_debt_leg_categories/migration.sql';
import m0064 from './20260929104636_revert_backfilled_atm_consolidations/migration.sql';
import m0065 from './20260929124729_replace_needs_embedding_index/migration.sql';
import m0066 from './20260929124829_live_account_created_index/migration.sql';
import m0067 from './20260929124929_repair_orphaned_consolidation_children/migration.sql';
import m0068 from './20260929164000_seed_tracked_cash_withdrawal_category/migration.sql';
import m0069 from './20260929184637_monobank_entry_external_index/migration.sql';

  export default {
    migrations: {
      "20251226214824_normal_dragon_man": m0000,
"20251231150737_late_red_wolf": m0001,
"20260101160630_dark_prima": m0002,
"20260102130718_unusual_maestro": m0003,
"20260102133539_cloudy_juggernaut": m0004,
"20260103202646_omniscient_jasper_sitwell": m0005,
"20260104090857_nice_warlock": m0006,
"20260131075924_pretty_puck": m0007,
"20260131083253_breezy_darkhawk": m0008,
"20260131174638_fine_molten_man": m0009,
"20260205211701_light_loa": m0010,
"20260206065349_windy_lyja": m0011,
"20260207213320_smooth_hedge_knight": m0012,
"20260212075803_fat_wild_child": m0013,
"20260222112655_light_calypso": m0014,
"20260414200000_add_entry_exchange_rate_and_to_iban": m0015,
"20260419000000_add_needs_embedding": m0016,
"20260421123659_drop_unused_fts_tables": m0017,
"20260424153714_add_transaction_tags_is_primary": m0018,
"20260426070408_add_consolidation_ledger": m0019,
"20260501005500_add_rules": m0020,
"20260501005640_add_updated_by": m0021,
"20260518000000_add_uncategorized_transaction_indexes": m0022,
"20260519000000_add_mcc_default_category": m0023,
"20260519000140_default_category_translations": m0024,
"20260519000320_add_consolidation_query_indexes": m0025,
"20260519000500_money_data_upgrade": m0026,
"20260603174000_mark_fee_entries": m0027,
"20260604094000_add_crypto_instruments": m0028,
"20260605150000_add_instrument_market_data_jobs": m0029,
"20260606094000_seed_top_crypto_market_prices": m0030,
"20260607094000_add_account_lookup_indexes": m0031,
"20260607094001_add_budget_planning": m0032,
"20260612094000_add_transaction_entry_kind": m0033,
"20260619112000_add_debt_target_base_valuation": m0034,
"20260708190000_add_debt_events": m0035,
"20260715160000_repair_borrowed_debt_migration": m0036,
"20260731121320_repair_invalid_account_ibans": m0037,
"20260801160000_repair_zero_target_debt_accounts": m0038,
"20260806070640_add_bank_integrations": m0039,
"20260807105320_drop_bank_syncs_token": m0040,
"20260808144000_add_deposit_account_fields": m0041,
"20260809182640_backfill_file_import_integrations": m0042,
"20260810221320_update_default_account_icons": m0043,
"20260812020000_categorize_debt_settlement_expenses": m0044,
"20260813054640_add_transaction_entry_quote": m0045,
"20260814093320_repoint_debt_event_entries": m0046,
"20260815132000_repair_double_counted_manual_debt_events": m0047,
"20260816170640_repair_cross_instrument_debt_events": m0048,
"20260817205320_add_bank_sync_backward_limit": m0049,
"20260817205320_add_onboarding_completed": m0050,
"20260819004000_add_onboarding_step_and_ai_consent": m0051,
"20260820042640_soft_cerebro": m0052,
"20260821081320_backfill_ai_consent_for_existing_installs": m0053,
"20260822120000_drop_runway_widget_setting": m0054,
"20260915094359_add_runway_settings": m0055,
"20260916035127_marvelous_menace": m0056,
"20260916204027_add_debt_system_categories": m0057,
"20260919203320_debt_v2_money_legs": m0058,
"20260923190144_add_monobank_setup_balance": m0059,
"20260924213051_round_debt_event_micro_units": m0060,
"20260927184706_round_transfer_micro_units": m0061,
"20260928045508_backfill_monobank_atm_mcc": m0062,
"20260928111005_fix_transfer_and_debt_leg_categories": m0063,
"20260929104636_revert_backfilled_atm_consolidations": m0064,
"20260929124729_replace_needs_embedding_index": m0065,
"20260929124829_live_account_created_index": m0066,
"20260929124929_repair_orphaned_consolidation_children": m0067,
"20260929164000_seed_tracked_cash_withdrawal_category": m0068,
"20260929184637_monobank_entry_external_index": m0069
}
  }
  