import { CategoryEntityInterface, CategoryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { db } from '../../@generic/drizzle/db/db';

export const getCategoryByIdQuery = (id: number): CategoryEntityInterface | null =>
    db.select().from(CategoryEntityTable).where(eq(CategoryEntityTable.id, id)).limit(1).get() ?? null;
