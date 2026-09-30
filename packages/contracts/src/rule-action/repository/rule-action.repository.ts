import { eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { RuleActionCreateEntityInterface } from '../entity/rule-action-create-entity.interface';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

export class RuleActionRepository extends Context.Service<RuleActionRepository>()('@budgie/contracts/RuleActionRepository', {
    make: Effect.succeed({
        bulkCreate: Effect.fn('RuleActionRepository.bulkCreate')(function* (inputs: RuleActionCreateEntityInterface[]) {
            if (isEmptyArray(inputs)) {
                return [];
            }

            return yield* Db.query(db => db.insert(RuleActionEntityTable).values(inputs).returning());
        }),
        create: (input: RuleActionCreateEntityInterface) =>
            Db.query(db => db.insert(RuleActionEntityTable).values([input]).returning()).pipe(Effect.map(([action]) => action)),
        deleteByRuleId: (ruleId: number) =>
            Db.query(db => db.delete(RuleActionEntityTable).where(eq(RuleActionEntityTable.ruleId, ruleId))),
        truncate: () => Db.query(db => db.delete(RuleActionEntityTable)),
        findByRuleId: (ruleId: number) =>
            Db.query(db => db.query.RuleActionEntityTable.findMany({ where: eq(RuleActionEntityTable.ruleId, ruleId) }))
    })
}) {
    static readonly layer = Layer.effect(RuleActionRepository, RuleActionRepository.make);
}
