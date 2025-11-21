import { eq, inArray, sql } from 'drizzle-orm';

import * as schema from '../../schema';
import { TagCreateEntityInterface } from '../entity/tag-create-entity.interface';
import { TagUpdateEntityInterface } from '../entity/tag-update-entity.interface';
import { TagEntityTable } from '../table/tag-entity.table';

import type { TagEntityInterface } from '../entity/tag-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class TagRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByIds(ids: number[]) {
        return this.db.query.TagEntityTable.findMany({
            where: inArray(TagEntityTable.id, ids)
        });
    }

    findBySearchQuery(search: string) {
        return this.db.query.TagEntityTable.findMany({
            where: sql`LOWER (${TagEntityTable.title}) LIKE ${`%${search.toLowerCase()}%`}`
        });
    }

    async create(input: TagCreateEntityInterface): Promise<TagEntityInterface> {
        const [tag] = await this.db.insert(TagEntityTable).values([input]).returning();

        return tag;
    }

    async updateById(id: number, input: TagUpdateEntityInterface): Promise<TagEntityInterface> {
        const [tag] = await this.db.update(TagEntityTable).set(input).where(eq(TagEntityTable.id, id)).returning();

        return tag;
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(TagEntityTable).where(eq(TagEntityTable.id, id));
    }
}
