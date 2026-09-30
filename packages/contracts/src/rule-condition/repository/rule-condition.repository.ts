import { eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { RuleConditionCreateEntityInterface } from '../entity/rule-condition-create-entity.interface';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

export class RuleConditionRepository extends Context.Service<RuleConditionRepository>()('@budgie/contracts/RuleConditionRepository', {
    make: Effect.succeed({
        bulkCreate: Effect.fn('RuleConditionRepository.bulkCreate')(function* (inputs: RuleConditionCreateEntityInterface[]) {
            if (isEmptyArray(inputs)) {
                return [];
            }

            return yield* Db.query(db => db.insert(RuleConditionEntityTable).values(inputs).returning());
        }),
        create: (input: RuleConditionCreateEntityInterface) =>
            Db.query(db => db.insert(RuleConditionEntityTable).values([input]).returning()).pipe(Effect.map(([condition]) => condition)),
        deleteByRuleId: (ruleId: number) =>
            Db.query(db => db.delete(RuleConditionEntityTable).where(eq(RuleConditionEntityTable.ruleId, ruleId))),
        truncate: () => Db.query(db => db.delete(RuleConditionEntityTable)),
        findByRuleId: (ruleId: number) =>
            Db.query(db => db.query.RuleConditionEntityTable.findMany({ where: eq(RuleConditionEntityTable.ruleId, ruleId) }))
    })
}) {
    static readonly layer = Layer.effect(RuleConditionRepository, RuleConditionRepository.make);
}
