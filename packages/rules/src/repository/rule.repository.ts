import { Db, RuleEntityTable, buildTranslatedCategoryRelation } from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { LanguageEnum, RuleCreateEntityInterface, RuleUpdateEntityInterface } from '@budgie/contracts';

const ACTIVE_CHILD_WHERE = { deletedAt: { isNull: true } } as const;

export class RuleRepository extends Context.Service<RuleRepository>()('@budgie/rules/RuleRepository', {
    make: Effect.succeed({
        findById: (id: number) =>
            Db.query(db =>
                db.query.RuleEntityTable.findFirst({
                    where: { id, deletedAt: { isNull: true } }
                })
            ),
        findAllWithConditions: Db.query(db =>
            db.query.RuleEntityTable.findMany({
                where: { deletedAt: { isNull: true } },
                orderBy: { id: 'asc' },
                with: {
                    conditions: { where: ACTIVE_CHILD_WHERE }
                }
            })
        ),
        create: (input: RuleCreateEntityInterface) =>
            Db.query(db => db.insert(RuleEntityTable).values([input]).returning()).pipe(Effect.map(([rule]) => rule)),
        updateById: (id: number, input: RuleUpdateEntityInterface) =>
            Db.query(db =>
                db
                    .update(RuleEntityTable)
                    .set(input)
                    .where(and(eq(RuleEntityTable.id, id), isNull(RuleEntityTable.deletedAt)))
                    .returning()
            ).pipe(Effect.map(([rule]) => rule)),
        archiveById: (id: number) =>
            Db.query(db => db.update(RuleEntityTable).set({ deletedAt: new Date() }).where(eq(RuleEntityTable.id, id))),
        findEnabledWithRelations: Db.query(db =>
            db.query.RuleEntityTable.findMany({
                where: { enabled: true, deletedAt: { isNull: true } },
                orderBy: { id: 'asc' },
                with: {
                    conditions: { where: ACTIVE_CHILD_WHERE },
                    actions: { where: ACTIVE_CHILD_WHERE }
                }
            })
        ),
        findByIdWithRelations: (id: number) =>
            Db.query(db =>
                db.query.RuleEntityTable.findFirst({
                    where: { id, deletedAt: { isNull: true } },
                    with: {
                        conditions: { where: ACTIVE_CHILD_WHERE },
                        actions: { where: ACTIVE_CHILD_WHERE }
                    }
                })
            ),
        findAllWithActionsAndCategories: (language: LanguageEnum) =>
            Db.query(db =>
                db.query.RuleEntityTable.findMany({
                    where: { deletedAt: { isNull: true } },
                    orderBy: { id: 'asc' },
                    with: {
                        conditions: { where: ACTIVE_CHILD_WHERE },
                        actions: {
                            where: ACTIVE_CHILD_WHERE,
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
