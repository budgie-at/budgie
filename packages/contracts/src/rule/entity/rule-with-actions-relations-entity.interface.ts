import { RuleAssociationEnum } from '../enum/rule-association.enum';

import type { RuleEntityInterface } from './rule-entity.interface';
import type { RuleActionWithRelationsEntityInterface } from '../../rule-action/entity/rule-action-with-relations-entity.interface';
import type { RuleConditionEntityInterface } from '../../rule-condition/entity/rule-condition-entity.interface';

export interface RuleWithActionsRelationsEntityInterface extends RuleEntityInterface {
    readonly [RuleAssociationEnum.CONDITIONS]: RuleConditionEntityInterface[];
    readonly [RuleAssociationEnum.ACTIONS]: RuleActionWithRelationsEntityInterface[];
}
