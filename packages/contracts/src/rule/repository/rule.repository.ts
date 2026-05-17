import { and, asc, eq, isNull } from 'drizzle-orm';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { RuleCreateEntityInterface } from '../entity/rule-create-entity.interface';
import { RuleUpdateEntityInterface } from '../entity/rule-update-entity.interface';
import { RuleAssociationEnum } from '../enum/rule-association.enum';
import { RuleEntityTable } from '../table/rule-entity.table';

import type { TX } from '../../@generic/type/db.type';
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

    findEnabledWithRelations() {
        return this.db.query.RuleEntityTable.findMany({
            where: and(eq(RuleEntityTable.enabled, true), isNull(RuleEntityTable.deletedAt)),
            orderBy: [asc(RuleEntityTable.id)],
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: true
            }
        });
    }

    findByIdWithRelations(id: number) {
        return this.db.query.RuleEntityTable.findFirst({
            where: and(eq(RuleEntityTable.id, id), isNull(RuleEntityTable.deletedAt)),
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: true
            }
        });
    }

    findAllWithActionsAndCategories(language: LanguageEnum) {
        return this.db.query.RuleEntityTable.findMany({
            where: isNull(RuleEntityTable.deletedAt),
            orderBy: [asc(RuleEntityTable.id)],
            with: {
                [RuleAssociationEnum.CONDITIONS]: true,
                [RuleAssociationEnum.ACTIONS]: {
                    with: {
                        category: buildTranslatedCategoryRelation(language),
                        tag: true
                    }
                }
            }
        });
    }

    async create(input: RuleCreateEntityInterface, tx?: TX): Promise<RuleEntityInterface> {
        const [rule] = await (tx ?? this.db).insert(RuleEntityTable).values([input]).returning();

        return rule;
    }

    async updateById(id: number, input: RuleUpdateEntityInterface, tx?: TX): Promise<RuleEntityInterface> {
        const [rule] = await (tx ?? this.db).update(RuleEntityTable).set(input).where(eq(RuleEntityTable.id, id)).returning();

        return rule;
    }

    async archiveById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(RuleEntityTable).set({ deletedAt: new Date() }).where(eq(RuleEntityTable.id, id));
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(RuleEntityTable);
    }
}
