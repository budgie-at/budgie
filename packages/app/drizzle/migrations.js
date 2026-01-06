// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_normal_dragon_man.sql';
import m0001 from './0001_late_red_wolf.sql';
import m0002 from './0002_dark_prima.sql';
import m0003 from './0003_unusual_maestro.sql';
import m0004 from './0004_cloudy_juggernaut.sql';
import m0005 from './0005_omniscient_jasper_sitwell.sql';
import m0006 from './0006_nice_warlock.sql';
import m0007 from './0007_careless_risque.sql';

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
        m0007
    }
};
