import { RuleActionWithRelationsEntityInterface } from '../../rule-action/entity/rule-action-with-relations-entity.interface';
import { RuleConditionEntityInterface } from '../../rule-condition/entity/rule-condition-entity.interface';

import { RuleEntityInterface } from './rule-entity.interface';

export interface RuleWithActionsRelationsEntityInterface extends RuleEntityInterface {
    readonly conditions: RuleConditionEntityInterface[];
    readonly actions: RuleActionWithRelationsEntityInterface[];
}
