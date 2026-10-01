import * as SqliteClient from '@effect/sql-sqlite-react-native/SqliteClient';
import * as Effect from 'effect/Effect';

import { isNotEmptyString } from '@rnw-community/shared';

import { DATABASE_LOCATION } from '../constant/database-location.constant';
import { DatabaseOpenError } from '../error/database-open.error';

export const openSqliteClient = (filename: string, encryptionKey: string | null) =>
    SqliteClient.make({ filename, location: DATABASE_LOCATION, ...(isNotEmptyString(encryptionKey) && { encryptionKey }) }).pipe(
        Effect.tap(client => client.unsafe('SELECT count(*) FROM sqlite_master')), // oxlint-disable-line lingui/no-unlocalized-strings
        Effect.mapError(cause => new DatabaseOpenError({ cause })),
        Effect.catchDefect(cause => Effect.fail(new DatabaseOpenError({ cause })))
    );
