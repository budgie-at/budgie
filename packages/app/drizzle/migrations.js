// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_faulty_archangel.sql';
import m0001 from './0001_curved_adam_warlock.sql';
import m0002 from './0002_chunky_nick_fury.sql';
import m0003 from './0003_absent_wong.sql';
import m0004 from './0004_naive_night_thrasher.sql';
import m0005 from './0005_careless_nighthawk.sql';
import m0006 from './0006_eager_vengeance.sql';

export default {
    journal,
    migrations: {
        m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
};
