import { and, asc, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { Db } from '../../@generic/service/db.service';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { RuleCreateEntityInterface } from '../entity/rule-create-entity.interface';
import { RuleUpdateEntityInterface } from '../entity/rule-update-entity.interface';
import { RuleAssociationEnum } from '../enum/rule-association.enum';
import { RuleEntityTable } from '../table/rule-entity.table';

export class RuleRepository extends Context.Service<RuleRepository>()('@budgie/contracts/RuleRepository', {
    make: Effect.succeed({
        findAllWithConditions: () =>
            Db.query(db =>
                db.query.RuleEntityTable.findMany({
                    where: isNull(RuleEntityTable.deletedAt),
                    orderBy: [asc(RuleEntityTable.id)],
                    with: {
                        [RuleAssociationEnum.CONDITIONS]: true
                    }
                })
            ),
        create: (input: RuleCreateEntityInterface) =>
            Db.query(db => db.insert(RuleEntityTable).values([input]).returning()).pipe(Effect.map(([rule]) => rule)),
        updateById: (id: number, input: RuleUpdateEntityInterface) =>
            Db.query(db => db.update(RuleEntityTable).set(input).where(eq(RuleEntityTable.id, id)).returning()).pipe(
                Effect.map(([rule]) => rule)
            ),
        archiveById: (id: number) =>
            Db.query(db => db.update(RuleEntityTable).set({ deletedAt: new Date() }).where(eq(RuleEntityTable.id, id))),
        truncate: () => Db.query(db => db.delete(RuleEntityTable)),
        findAll: () =>
            Db.query(db =>
                db.query.RuleEntityTable.findMany({
                    where: isNull(RuleEntityTable.deletedAt),
                    orderBy: [asc(RuleEntityTable.id)]
                })
            ),
        findEnabledWithRelations: () =>
            Db.query(db =>
                db.query.RuleEntityTable.findMany({
                    where: and(eq(RuleEntityTable.enabled, true), isNull(RuleEntityTable.deletedAt)),
                    orderBy: [asc(RuleEntityTable.id)],
                    with: {
                        [RuleAssociationEnum.CONDITIONS]: true,
                        [RuleAssociationEnum.ACTIONS]: true
                    }
                })
            ),
        findByIdWithRelations: (id: number) =>
            Db.query(db =>
                db.query.RuleEntityTable.findFirst({
                    where: and(eq(RuleEntityTable.id, id), isNull(RuleEntityTable.deletedAt)),
                    with: {
                        [RuleAssociationEnum.CONDITIONS]: true,
                        [RuleAssociationEnum.ACTIONS]: true
                    }
                })
            ),
        findAllWithActionsAndCategories: (language: LanguageEnum) =>
            Db.query(db =>
                db.query.RuleEntityTable.findMany({
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
                })
            )
    })
}) {
    static readonly layer = Layer.effect(RuleRepository, RuleRepository.make);
}
