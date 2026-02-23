import { eq } from 'drizzle-orm';

import { DBOrTX } from '../../@generic/type/db.type';
import { RuleActionCreateEntityInterface } from '../entity/rule-action-create-entity.interface';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

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

    async create(input: RuleActionCreateEntityInterface, tx?: DBOrTX): Promise<RuleActionEntityInterface> {
        const [action] = await (tx ?? this.db).insert(RuleActionEntityTable).values([input]).returning();

        return action;
    }

    async bulkCreate(inputs: RuleActionCreateEntityInterface[], tx?: DBOrTX): Promise<RuleActionEntityInterface[]> {
        if (inputs.length === 0) {
            return [];
        }

        return (tx ?? this.db).insert(RuleActionEntityTable).values(inputs).returning();
    }

    async deleteByRuleId(ruleId: number, tx?: DBOrTX): Promise<void> {
        await (tx ?? this.db).delete(RuleActionEntityTable).where(eq(RuleActionEntityTable.ruleId, ruleId));
    }

    async truncate(tx?: DBOrTX): Promise<void> {
        await (tx ?? this.db).delete(RuleActionEntityTable);
    }
}
