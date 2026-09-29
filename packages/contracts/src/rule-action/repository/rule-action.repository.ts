import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { RuleActionCreateEntityInterface } from '../entity/rule-action-create-entity.interface';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class RuleActionRepository {
    readonly create = Effect.fn('RuleActionRepository.create')(function* (input: RuleActionCreateEntityInterface) {
        const [action] = yield* Db.query(db => db.insert(RuleActionEntityTable).values([input]).returning());

        return action;
    });

    readonly bulkCreate = Effect.fn('RuleActionRepository.bulkCreate')(function* (inputs: RuleActionCreateEntityInterface[]) {
        if (isEmptyArray(inputs)) {
            return [];
        }

        return yield* Db.query(db => db.insert(RuleActionEntityTable).values(inputs).returning());
    });

    readonly deleteByRuleId = Effect.fn('RuleActionRepository.deleteByRuleId')(function* (ruleId: number) {
        yield* Db.query(db => db.delete(RuleActionEntityTable).where(eq(RuleActionEntityTable.ruleId, ruleId)));
    });

    readonly truncate = Effect.fn('RuleActionRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(RuleActionEntityTable));
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByRuleId(ruleId: number) {
        return this.db.query.RuleActionEntityTable.findMany({
            where: eq(RuleActionEntityTable.ruleId, ruleId)
        });
    }
}
