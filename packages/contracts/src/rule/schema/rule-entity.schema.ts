import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { RuleEntityTable } from '../table/rule-entity.table';

export const RuleEntitySchema = createSelectSchema(RuleEntityTable, {
    ...BaseEntityFields,
    enabled: schema => schema.describe('Whether the rule is enabled.'),
    conditionMatchType: schema => schema.describe('How conditions are matched: ALL (AND) or ANY (OR).')
});
