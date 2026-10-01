import { entityKind } from 'drizzle-orm';
import { SQLiteEffectTransaction } from 'drizzle-orm/sqlite-core/effect';

import type { DbQueryEffectHKTInterface } from '../interface/db-query-effect-hkt.interface';
import type { DbRelationsType } from '../type/db-relations.type';

export class EffectSqliteClientTransaction extends SQLiteEffectTransaction<DbQueryEffectHKTInterface, unknown, DbRelationsType> {
    static override readonly [entityKind]: string = 'EffectSqliteClientTransaction';
}
