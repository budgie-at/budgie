import type { DB } from '@budgie/contracts';

export interface TestDatabaseHandleInterface {
    readonly database: DB;
    readonly dispose: () => Promise<void>;
}
