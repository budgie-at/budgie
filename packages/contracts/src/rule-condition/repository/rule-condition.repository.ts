import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { RuleConditionCreateEntityInterface } from '../entity/rule-condition-create-entity.interface';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class RuleConditionRepository {
    readonly create = Effect.fn('RuleConditionRepository.create')(function* (input: RuleConditionCreateEntityInterface) {
        const [condition] = yield* Db.query(db => db.insert(RuleConditionEntityTable).values([input]).returning());

        return condition;
    });

    readonly bulkCreate = Effect.fn('RuleConditionRepository.bulkCreate')(function* (inputs: RuleConditionCreateEntityInterface[]) {
        if (isEmptyArray(inputs)) {
            return [];
        }

        return yield* Db.query(db => db.insert(RuleConditionEntityTable).values(inputs).returning());
    });

    readonly deleteByRuleId = Effect.fn('RuleConditionRepository.deleteByRuleId')(function* (ruleId: number) {
        yield* Db.query(db => db.delete(RuleConditionEntityTable).where(eq(RuleConditionEntityTable.ruleId, ruleId)));
    });

    readonly truncate = Effect.fn('RuleConditionRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(RuleConditionEntityTable));
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByRuleId(ruleId: number) {
        return this.db.query.RuleConditionEntityTable.findMany({
            where: eq(RuleConditionEntityTable.ruleId, ruleId)
        });
    }
}
