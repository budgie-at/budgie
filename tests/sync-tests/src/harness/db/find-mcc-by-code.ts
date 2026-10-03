import { MccCategoryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const findMccByCode = (mcc: string) =>
    Effect.gen(function* () {
        const row = (yield* testDb.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc)))[0];
        if (row === undefined) {
            throw new Error(`MCC ${mcc} not found`);
        }
        return { id: row.id, mccGroupId: row.mccGroupId };
    });
