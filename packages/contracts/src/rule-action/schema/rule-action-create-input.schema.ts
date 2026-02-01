import { z } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { RuleActionTypeEnum } from '../../rule/enum/rule-action-type.enum';

import { RuleActionCreateEntitySchema } from './rule-action-create-entity.schema';

const ACTION_TYPE_REQUIRED_FIELD: Record<RuleActionTypeEnum, 'categoryId' | 'tagId' | 'accountId'> = {
    [RuleActionTypeEnum.SET_CATEGORY]: 'categoryId',
    [RuleActionTypeEnum.ADD_TAG]: 'tagId',
    [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: 'accountId'
};

export const RuleActionCreateInputSchema = RuleActionCreateEntitySchema.omit({ ruleId: true }).superRefine((data, ctx) => {
    const requiredField = ACTION_TYPE_REQUIRED_FIELD[data.type];
    if (!isDefined(data[requiredField])) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${requiredField} is required for ${data.type} action`,
            path: [requiredField]
        });
    }
});
