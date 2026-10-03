import { Db, RuleConditionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import type { RuleConditionCreateEntityInterface } from '@budgie/contracts';

export class RuleConditionRepository extends Context.Service<RuleConditionRepository>()('@budgie/rules/RuleConditionRepository', {
    make: Effect.succeed({
        bulkCreate: Effect.fn('RuleConditionRepository.bulkCreate')(function* (inputs: RuleConditionCreateEntityInterface[]) {
            if (isEmptyArray(inputs)) {
                return [];
            }

            return yield* Db.query(db => db.insert(RuleConditionEntityTable).values(inputs).returning());
        }),
        deleteByRuleId: (ruleId: number) =>
            Db.query(db => db.delete(RuleConditionEntityTable).where(eq(RuleConditionEntityTable.ruleId, ruleId)))
    })
}) {
    static readonly layer = Layer.effect(RuleConditionRepository, RuleConditionRepository.make);
}
