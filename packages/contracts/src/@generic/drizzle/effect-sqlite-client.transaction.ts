import { SQLiteEffectTransaction } from 'drizzle-orm/sqlite-core/effect';

import type { relations } from '../../relations';
import type { DbQueryEffectHKTInterface } from '../interface/db-query-effect-hkt.interface';

export class EffectSqliteClientTransaction extends SQLiteEffectTransaction<DbQueryEffectHKTInterface, unknown, typeof relations> {}
