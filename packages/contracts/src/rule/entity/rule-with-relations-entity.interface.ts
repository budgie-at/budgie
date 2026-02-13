import type { RuleEntityInterface } from './rule-entity.interface';
import type { RuleActionEntityInterface } from '../../rule-action/entity/rule-action-entity.interface';
import type { RuleConditionEntityInterface } from '../../rule-condition/entity/rule-condition-entity.interface';
import type { RuleAssociationEnum } from '../enum/rule-association.enum';

export interface RuleWithRelationsEntityInterface extends RuleEntityInterface {
    [RuleAssociationEnum.CONDITIONS]: RuleConditionEntityInterface[];
    [RuleAssociationEnum.ACTIONS]: RuleActionEntityInterface[];
}
