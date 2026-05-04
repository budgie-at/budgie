import { eq } from 'drizzle-orm';

import { isEmptyArray } from '@rnw-community/shared';

import { RuleConditionCreateEntityInterface } from '../entity/rule-condition-create-entity.interface';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type * as schema from '../../schema';
import type { RuleConditionEntityInterface } from '../entity/rule-condition-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class RuleConditionRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByRuleId(ruleId: number) {
        return this.db.query.RuleConditionEntityTable.findMany({
            where: eq(RuleConditionEntityTable.ruleId, ruleId)
        });
    }

    async create(input: RuleConditionCreateEntityInterface, tx?: DB): Promise<RuleConditionEntityInterface> {
        const [condition] = await (tx ?? this.db).insert(RuleConditionEntityTable).values([input]).returning();

        return condition;
    }

    async bulkCreate(inputs: RuleConditionCreateEntityInterface[], tx?: DB): Promise<RuleConditionEntityInterface[]> {
        if (isEmptyArray(inputs)) {
            return [];
        }

        return (tx ?? this.db).insert(RuleConditionEntityTable).values(inputs).returning();
    }

    async deleteByRuleId(ruleId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(RuleConditionEntityTable).where(eq(RuleConditionEntityTable.ruleId, ruleId));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(RuleConditionEntityTable);
    }
}
