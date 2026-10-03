import { Db, RuleActionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import type { RuleActionCreateEntityInterface } from '@budgie/contracts';

export class RuleActionRepository extends Context.Service<RuleActionRepository>()('@budgie/rules/RuleActionRepository', {
    make: Effect.succeed({
        bulkCreate: Effect.fn('RuleActionRepository.bulkCreate')(function* (inputs: RuleActionCreateEntityInterface[]) {
            if (isEmptyArray(inputs)) {
                return [];
            }

            return yield* Db.query(db => db.insert(RuleActionEntityTable).values(inputs).returning());
        }),
        deleteByRuleId: (ruleId: number) => Db.query(db => db.delete(RuleActionEntityTable).where(eq(RuleActionEntityTable.ruleId, ruleId)))
    })
}) {
    static readonly layer = Layer.effect(RuleActionRepository, RuleActionRepository.make);
}
