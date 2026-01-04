import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { RuleActionTypeEnum } from '../../rule/enum/rule-action-type.enum';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

export const RuleActionEntitySchema = createSelectSchema(RuleActionEntityTable, {
    ...BaseEntityFields,
    ruleId: schema => schema.describe('The rule ID this action belongs to.'),
    type: zodEnum(RuleActionTypeEnum).describe('The action type.'),
    categoryId: schema => schema.nullable().describe('The category ID for SET_CATEGORY action.'),
    tagId: schema => schema.nullable().describe('The tag ID for ADD_TAG action.'),
    accountId: schema => schema.nullable().describe('The account ID for CONVERT_TO_TRANSFER action.')
});
