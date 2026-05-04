import { eq } from 'drizzle-orm';

import { isEmptyArray } from '@rnw-community/shared';

import { RuleActionCreateEntityInterface } from '../entity/rule-action-create-entity.interface';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type * as schema from '../../schema';
import type { RuleActionEntityInterface } from '../entity/rule-action-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class RuleActionRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByRuleId(ruleId: number) {
        return this.db.query.RuleActionEntityTable.findMany({
            where: eq(RuleActionEntityTable.ruleId, ruleId)
        });
    }

    async create(input: RuleActionCreateEntityInterface, tx?: DB): Promise<RuleActionEntityInterface> {
        const [action] = await (tx ?? this.db).insert(RuleActionEntityTable).values([input]).returning();

        return action;
    }

    async bulkCreate(inputs: RuleActionCreateEntityInterface[], tx?: DB): Promise<RuleActionEntityInterface[]> {
        if (isEmptyArray(inputs)) {
            return [];
        }

        return (tx ?? this.db).insert(RuleActionEntityTable).values(inputs).returning();
    }

    async deleteByRuleId(ruleId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(RuleActionEntityTable).where(eq(RuleActionEntityTable.ruleId, ruleId));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(RuleActionEntityTable);
    }
}
