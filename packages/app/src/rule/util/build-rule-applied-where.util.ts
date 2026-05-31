import { RuleActionTypeEnum, TransactionEntityTable, TransactionEntryEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import { SQL, and, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { RuleActionEntityInterface } from '@budgie/contracts';

const buildActionPredicate = (action: RuleActionEntityInterface): SQL | null => {
    switch (action.type) {
        case RuleActionTypeEnum.SET_CATEGORY:
            if (!isDefined(action.categoryId)) {
                return null;
            }

            return sql`NOT EXISTS (SELECT 1 FROM ${TransactionEntryEntityTable} applied_entry WHERE applied_entry.transaction_id = ${TransactionEntityTable.id} AND applied_entry.deleted_at IS NULL AND IFNULL(applied_entry.category_id, -1) != ${action.categoryId})`;

        case RuleActionTypeEnum.ADD_TAG:
            if (!isDefined(action.tagId)) {
                return null;
            }

            return sql`EXISTS (SELECT 1 FROM ${TransactionTagsEntityTable} applied_tag WHERE applied_tag.transaction_id = ${TransactionEntityTable.id} AND applied_tag.tag_id = ${action.tagId})`;

        case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
            if (!isDefined(action.accountId)) {
                return null;
            }

            return sql`${TransactionEntityTable.type} IN ('TRANSFER', 'DEBT') AND ${action.accountId} IN (${TransactionEntityTable.toAccountId}, ${TransactionEntityTable.fromAccountId})`;

        default:
            return null;
    }
};

export const buildRuleAppliedWhere = (actions: RuleActionEntityInterface[]): SQL => {
    const predicates = actions.map(buildActionPredicate).filter(isDefined);

    return isNotEmptyArray(predicates) ? (and(...predicates) ?? sql`1 = 1`) : sql`1 = 1`;
};
