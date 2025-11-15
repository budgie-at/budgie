import { InstrumentRepository } from '@budgie/contracts';

import { db } from '../../drizzle/db/db';

export const instrumentRepository = new InstrumentRepository(db);
