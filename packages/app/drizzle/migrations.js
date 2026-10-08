// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20261001084501_baseline/migration.sql';
import m0001 from './20261002214604_recurring_series/migration.sql';
import m0002 from './20261004064254_transaction_import_fingerprint/migration.sql';
import m0003 from './20261004090619_seed_account_deleted_transfer_category/migration.sql';
import m0004 from './20261004121613_transaction_tag_source/migration.sql';
import m0005 from './20261005210950_account_installment_count/migration.sql';
import m0006 from './20261009005433_duplicate_transfer_repair/migration.sql';

  export default {
    migrations: {
      "20261001084501_baseline": m0000,
"20261002214604_recurring_series": m0001,
"20261004064254_transaction_import_fingerprint": m0002,
"20261004090619_seed_account_deleted_transfer_category": m0003,
"20261004121613_transaction_tag_source": m0004,
"20261005210950_account_installment_count": m0005,
"20261009005433_duplicate_transfer_repair": m0006
}
  }

