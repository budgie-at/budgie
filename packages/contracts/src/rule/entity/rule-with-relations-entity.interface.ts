import { RuleAssociationEnum } from '../enum/rule-association.enum';

import type { RuleEntityInterface } from './rule-entity.interface';
import type { RuleActionEntityInterface } from '../../rule-action/entity/rule-action-entity.interface';
import type { RuleConditionEntityInterface } from '../../rule-condition/entity/rule-condition-entity.interface';

export interface RuleWithRelationsEntityInterface extends RuleEntityInterface {
    readonly [RuleAssociationEnum.CONDITIONS]: RuleConditionEntityInterface[];
    readonly [RuleAssociationEnum.ACTIONS]: RuleActionEntityInterface[];
}
