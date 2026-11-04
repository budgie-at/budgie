import { InstrumentEntityTable } from '@budgie/contracts';
import { InzhurSetupService } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

import { importInzhurStatement } from './import-inzhur-statement';
import { FIRST_URI } from './inzhur-statement-fixtures.constant';

export const importBaselineFundInstrument = Effect.fnUntraced(function* (isin: string) {
    const inzhurSetupService = yield* InzhurSetupService;
    yield* inzhurSetupService.setup(0);
    yield* importInzhurStatement(FIRST_URI);
    const [instrument] = yield* testDb.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, isin));

    return instrument;
});
