// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20261001084501_baseline/migration.sql';
import m0001 from './20261002214604_recurring_series/migration.sql';

  export default {
    migrations: {
      "20261001084501_baseline": m0000,
"20261002214604_recurring_series": m0001
}
  }
  