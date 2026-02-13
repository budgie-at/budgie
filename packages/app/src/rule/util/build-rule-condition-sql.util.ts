import {
    MccCategoryEntityTable,
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { SQL, and, sql } from 'drizzle-orm';

import { isNotEmptyString } from '@rnw-community/shared';

import type { Column } from 'drizzle-orm';

type RuleConditionInput = Pick<RuleConditionCreateInputInterface, 'field' | 'operator' | 'value' | 'secondaryValue'>;

const getColumnForField = (field: RuleConditionFieldEnum): Column | SQL | null => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return TransactionEntityTable.title;
        case RuleConditionFieldEnum.COMMENT:
            return TransactionEntityTable.comment;
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return TransactionEntityTable.type;
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return TransactionEntityTable.externalSource;
        case RuleConditionFieldEnum.ACCOUNT_ID:
            return sql`COALESCE(${TransactionEntityTable.fromAccountId}, ${TransactionEntityTable.toAccountId})`;
        case RuleConditionFieldEnum.MCC_CODE:
            return sql`(SELECT ${MccCategoryEntityTable.mcc} FROM ${MccCategoryEntityTable} WHERE ${MccCategoryEntityTable.id} = ${TransactionEntryEntityTable.mccCategoryId})`;
        case RuleConditionFieldEnum.AMOUNT:
            return null;
        default:
            return null;
    }
};

const buildOperatorSql = (
    column: Column | SQL,
    operator: RuleConditionOperatorEnum,
    value: string,
    secondaryValue: string | null
): SQL | null => {
    switch (operator) {
        case RuleConditionOperatorEnum.CONTAINS:
            return sql`CAST(${column} AS TEXT) LIKE ${`%${value}%`}`;
        case RuleConditionOperatorEnum.NOT_CONTAINS:
            return sql`CAST(${column} AS TEXT) NOT LIKE ${`%${value}%`}`;
        case RuleConditionOperatorEnum.EQUALS:
            return sql`CAST(${column} AS TEXT) = ${value} COLLATE NOCASE`;
        case RuleConditionOperatorEnum.NOT_EQUALS:
            return sql`CAST(${column} AS TEXT) != ${value} COLLATE NOCASE`;
        case RuleConditionOperatorEnum.GREATER_THAN:
            return sql`${column} > ${Number(value)}`;
        case RuleConditionOperatorEnum.LESS_THAN:
            return sql`${column} < ${Number(value)}`;
        case RuleConditionOperatorEnum.BETWEEN: {
            if (!isNotEmptyString(secondaryValue)) {
                return null;
            }

            const gteClause = sql`${column} >= ${Number(value)}`;
            const lteClause = sql`${column} <= ${Number(secondaryValue)}`;

            return and(gteClause, lteClause) ?? null;
        }
        case RuleConditionOperatorEnum.IN: {
            const inValues = value.split(',').map(item => item.trim());
            const placeholders = inValues.map(item => sql`${item}`);

            return sql`CAST(${column} AS TEXT) COLLATE NOCASE IN (${sql.join(placeholders, sql`, `)})`;
        }
        case RuleConditionOperatorEnum.MATCHES_REGEX:
            return null;
        default:
            return null;
    }
};

export const buildRuleConditionSql = (condition: RuleConditionInput): SQL | null => {
    const column = getColumnForField(condition.field);

    if (column === null) {
        return null;
    }

    return buildOperatorSql(column, condition.operator, condition.value, condition.secondaryValue);
};

export type { RuleConditionInput };
