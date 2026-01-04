import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { RULE_TITLE_MAX_LENGTH } from '../constant/rule-title-max-length.constant';
import { RULE_TITLE_MIN_LENGTH } from '../constant/rule-title-min-length.constant';
import { RuleEntityTable } from '../table/rule-entity.table';

export const RuleEntitySchema = createSelectSchema(RuleEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.min(RULE_TITLE_MIN_LENGTH).max(RULE_TITLE_MAX_LENGTH).describe('The rule title.'),
    priority: schema => schema.describe('The rule priority (higher numbers are evaluated later and can override).'),
    enabled: schema => schema.describe('Whether the rule is enabled.'),
    conditionMatchType: schema => schema.describe('How conditions are matched: ALL (AND) or ANY (OR).')
});
