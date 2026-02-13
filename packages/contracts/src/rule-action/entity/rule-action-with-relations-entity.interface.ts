import { CategoryEntityInterface } from '../../category/entity/category-entity.interface';
import { TagEntityInterface } from '../../tag/entity/tag-entity.interface';

import { RuleActionEntityInterface } from './rule-action-entity.interface';

export interface RuleActionWithRelationsEntityInterface extends RuleActionEntityInterface {
    readonly category?: CategoryEntityInterface | null;
    readonly tag?: TagEntityInterface | null;
}
