import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { RuleActionTypeEnum } from '../../rule/enum/rule-action-type.enum';

export const RuleActionCreateInputSchema = Schema.Struct({
    type: Schema.Enum(RuleActionTypeEnum),
    categoryId: Schema.NullOr(Schema.Finite),
    tagId: Schema.NullOr(Schema.Finite),
    accountId: Schema.NullOr(Schema.Finite)
}).check(
    Schema.makeFilter(action => [
        ...(action.type === RuleActionTypeEnum.SET_CATEGORY && !isDefined(action.categoryId)
            ? [{ path: ['categoryId'], issue: 'Category is required for SET_CATEGORY action' }]
            : []),
        ...(action.type === RuleActionTypeEnum.ADD_TAG && !isDefined(action.tagId)
            ? [{ path: ['tagId'], issue: 'Tag is required for ADD_TAG action' }]
            : []),
        ...(action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER && !isDefined(action.accountId)
            ? [{ path: ['accountId'], issue: 'Account is required for CONVERT_TO_TRANSFER action' }]
            : [])
    ])
);
