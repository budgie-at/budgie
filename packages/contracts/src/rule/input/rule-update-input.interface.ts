import type { RuleActionCreateInputInterface } from '../../rule-action/input/rule-action-create-input.interface';
import type { RuleConditionCreateInputInterface } from '../../rule-condition/input/rule-condition-create-input.interface';
import type { RuleUpdateEntityInterface } from '../entity/rule-update-entity.interface';

export type RuleUpdateInputInterface = RuleUpdateEntityInterface & {
    readonly conditions?: RuleConditionCreateInputInterface[];
    readonly actions?: RuleActionCreateInputInterface[];
};
