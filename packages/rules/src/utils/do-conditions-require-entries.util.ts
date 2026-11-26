import { RuleConditionFieldEnum } from '@budgie/contracts';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';

export const doConditionsRequireEntries = (conditions: readonly RuleConditionInputInterface[]): boolean =>
    conditions.some(condition => condition.field === RuleConditionFieldEnum.AMOUNT || condition.field === RuleConditionFieldEnum.MCC_CODE);
