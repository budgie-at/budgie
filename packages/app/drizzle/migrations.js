// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_normal_dragon_man.sql';
import m0001 from './0001_late_red_wolf.sql';
import m0002 from './0002_dark_prima.sql';
import m0003 from './0003_unusual_maestro.sql';
import m0004 from './0004_cloudy_juggernaut.sql';
import m0005 from './0005_omniscient_jasper_sitwell.sql';
import m0006 from './0006_nice_warlock.sql';
import m0007 from './0007_pretty_puck.sql';
import m0008 from './0008_breezy_darkhawk.sql';
import m0009 from './0009_fine_molten_man.sql';
import m0010 from './0010_light_loa.sql';
import m0011 from './0011_windy_lyja.sql';
import m0012 from './0012_smooth_hedge_knight.sql';
import m0013 from './0013_fat_wild_child.sql';
import m0014 from './0014_light_calypso.sql';
import m0015 from './0015_add_entry_exchange_rate_and_to_iban.sql';
import m0016 from './0016_add_needs_embedding.sql';
import m0017 from './0017_drop_unused_fts_tables.sql';
import m0018 from './0018_add_transaction_tags_is_primary.sql';
import m0019 from './0019_add_consolidation_ledger.sql';
import m0020 from './0020_add_rules.sql';
import m0021 from './0021_add_updated_by.sql';
import m0022 from './0022_default_category_translations.sql';
import m0023 from './0023_renormalize_default_category_titles.sql';

export default {
    journal,
    migrations: {
        m0000,
        m0001,
        m0002,
        m0003,
        m0004,
        m0005,
        m0006,
        m0007,
        m0008,
        m0009,
        m0010,
        m0011,
        m0012,
        m0013,
        m0014,
        m0015,
        m0016,
        m0017,
        m0018,
        m0019,
        m0020,
        m0021,
        m0022,
        m0023
    }
};
