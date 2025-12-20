import { useEffect } from 'react';
import { isDefined } from '@rnw-community/shared';
import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constant/db-name.constant';

/** @deprecated TODO: DELETE ME WHEN DB IS STABLE */
const __REMOVE_ME_RESET_DB = async () => {
    await global.__expoSqliteDb__?.closeAsync();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));
};

/** @deprecated TODO: REMOVE ME WHEN DB IS STABLE! */
export const useResetDb = (error: unknown) => {
    useEffect(() => {
        if (isDefined(error)) {
            void __REMOVE_ME_RESET_DB();
        }
    }, [error]);
};
