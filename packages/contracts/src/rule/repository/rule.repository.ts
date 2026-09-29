import { and, asc, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { Db } from '../../@generic/service/db.service';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { RuleCreateEntityInterface } from '../entity/rule-create-entity.interface';
import { RuleUpdateEntityInterface } from '../entity/rule-update-entity.interface';
import { RuleAssociationEnum } from '../enum/rule-association.enum';
import { RuleEntityTable } from '../table/rule-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class RuleRepository {
    readonly findAllWithConditions = Effect.fn('RuleRepository.findAllWithConditions')(function* () {
        return yield* Db.query(db =>
            db.query.RuleEntityTable.findMany({
                where: isNull(RuleEntityTable.deletedAt),
                orderBy: [asc(RuleEntityTable.id)],
                with: {
                    [RuleAssociationEnum.CONDITIONS]: true
                }
            })
        );
    });

    readonly create = Effect.fn('RuleRepository.create')(function* (input: RuleCreateEntityInterface) {
        const [rule] = yield* Db.query(db => db.insert(RuleEntityTable).values([input]).returning());

        return rule;
    });

    readonly updateById = Effect.fn('RuleRepository.updateById')(function* (id: number, input: RuleUpdateEntityInterface) {
        const [rule] = yield* Db.query(db => db.update(RuleEntityTable).set(input).where(eq(RuleEntityTable.id, id)).returning());

        return rule;
    });

    readonly archiveById = Effect.fn('RuleRepository.archiveById')(function* (id: number) {
        yield* Db.query(db => db.update(RuleEntityTable).set({ deletedAt: new Date() }).where(eq(RuleEntityTable.id, id)));
    });

    readonly truncate = Effect.fn('RuleRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(RuleEntityTable));
    });

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
                        tag: true,
                        account: true
                    }
                }
            }
        });
    }
}
