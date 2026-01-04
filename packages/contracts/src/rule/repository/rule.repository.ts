import { asc, eq, isNull, like } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { TX } from '../../@generic/type/db.type';
import { RuleCreateEntityInterface } from '../entity/rule-create-entity.interface';
import { RuleUpdateEntityInterface } from '../entity/rule-update-entity.interface';
import { RuleAssociationEnum } from '../enum/rule-association.enum';
import { RuleEntityTable } from '../table/rule-entity.table';

import type * as schema from '../../schema';
import type { RuleEntityInterface } from '../entity/rule-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class RuleRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.RuleEntityTable.findMany({
            where: isNull(RuleEntityTable.deletedAt),
            orderBy: [asc(RuleEntityTable.id)]
        });
    }

    findAllWithRelations() {
        return this.db.query.RuleEntityTable.findMany({
            where: isNull(RuleEntityTable.deletedAt),
            orderBy: [asc(RuleEntityTable.id)],
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: true
            }
        });
    }

    findEnabledWithRelations() {
        return this.db.query.RuleEntityTable.findMany({
            where: eq(RuleEntityTable.enabled, true),
            orderBy: [asc(RuleEntityTable.id)],
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: true
            }
        });
    }

    findById(id: number) {
        return this.db.query.RuleEntityTable.findFirst({
            where: eq(RuleEntityTable.id, id)
        });
    }

    findByIdWithRelations(id: number) {
        return this.db.query.RuleEntityTable.findFirst({
            where: eq(RuleEntityTable.id, id),
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: true
            }
        });
    }

    findBySearchQuery(search: string) {
        return this.db.query.RuleEntityTable.findMany({
            where: like(RuleEntityTable.titleSearch, `%${search.toLowerCase()}%`),
            orderBy: [asc(RuleEntityTable.id)],
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: {
                    with: {
                        category: true,
                        tag: true
                    }
                }
            }
        });
    }

    async create(input: RuleCreateEntityInterface, tx?: TX): Promise<RuleEntityInterface> {
        const [rule] = await (tx ?? this.db)
            .insert(RuleEntityTable)
            .values([{ ...input, titleSearch: input.title.toLowerCase() }])
            .returning();

        return rule;
    }

    async updateById(id: number, input: RuleUpdateEntityInterface, tx?: TX): Promise<RuleEntityInterface> {
        const [rule] = await (tx ?? this.db)
            .update(RuleEntityTable)
            .set({ ...input, ...(isDefined(input.title) && { titleSearch: input.title.toLowerCase() }) })
            .where(eq(RuleEntityTable.id, id))
            .returning();

        return rule;
    }

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(RuleEntityTable).where(eq(RuleEntityTable.id, id));
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(RuleEntityTable);
    }
}
