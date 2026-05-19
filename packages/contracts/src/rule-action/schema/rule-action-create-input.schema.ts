import { isDefined } from '@rnw-community/shared';

import { RuleActionTypeEnum } from '../../rule/enum/rule-action-type.enum';

import { RuleActionCreateEntitySchema } from './rule-action-create-entity.schema';

export const RuleActionCreateInputSchema = RuleActionCreateEntitySchema.omit({ ruleId: true }).superRefine((action, ctx) => {
    if (action.type === RuleActionTypeEnum.SET_CATEGORY && !isDefined(action.categoryId)) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Category is required for SET_CATEGORY action' });
    }
    if (action.type === RuleActionTypeEnum.ADD_TAG && !isDefined(action.tagId)) {
        ctx.addIssue({ code: 'custom', path: ['tagId'], message: 'Tag is required for ADD_TAG action' });
    }
    if (action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER && !isDefined(action.accountId)) {
        ctx.addIssue({ code: 'custom', path: ['accountId'], message: 'Account is required for CONVERT_TO_TRANSFER action' });
    }
});
