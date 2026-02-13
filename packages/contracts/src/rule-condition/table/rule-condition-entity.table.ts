import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { RuleConditionFieldEnum } from '../../rule/enum/rule-condition-field.enum';
import { RuleConditionOperatorEnum } from '../../rule/enum/rule-condition-operator.enum';
import { RuleEntityTable } from '../../rule/table/rule-entity.table';

export const RuleConditionEntityTable = sqliteTable(
    'rule_conditions',
    withBaseEntityTableColumns({
        ruleId: int('rule_id', { mode: 'number' })
            .notNull()
            .references(() => RuleEntityTable.id, { onDelete: 'cascade' }),
        field: text('field', { enum: convertEnumToDrizzleEnum(RuleConditionFieldEnum) })
            .$type<RuleConditionFieldEnum>()
            .notNull(),
        operator: text('operator', { enum: convertEnumToDrizzleEnum(RuleConditionOperatorEnum) })
            .$type<RuleConditionOperatorEnum>()
            .notNull(),
        value: text('value').notNull(),
        secondaryValue: text('secondary_value')
    }),
    () => [check('rule_condition_between_requires_secondary_value', sql`operator != 'BETWEEN' OR secondary_value IS NOT NULL`)]
);
