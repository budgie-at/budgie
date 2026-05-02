import { eq } from 'drizzle-orm';

import { MccCategoryEntityTable } from '@budgie/contracts';

import { testDb } from './setup';

export const findMccByCode = (mcc: string): { readonly id: number; readonly mccGroupId: number } => {
    const row = testDb.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc)).all()[0];
    if (row === undefined) {
        throw new Error(`MCC ${mcc} not found`);
    }
    return { id: row.id, mccGroupId: row.mccGroupId };
};
