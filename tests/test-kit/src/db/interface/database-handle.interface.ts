import type { DatabaseSync } from 'node:sqlite';

export interface DatabaseHandleInterface {
    readonly database: DatabaseSync;
    readonly filePath: string | null;
}
