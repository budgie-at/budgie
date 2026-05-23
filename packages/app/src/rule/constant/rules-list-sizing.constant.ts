import type { LegendListSizingInterface } from '../../@generic/interface/legend-list-sizing.interface';
import type { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';

const RULES_LIST_ESTIMATED_ITEM_SIZE = 116;
const RULES_LIST_SIMPLE_ITEM_LIMIT = 3;
const RULES_LIST_MEDIUM_ITEM_LIMIT = 6;

export const RULES_LIST_SIZING: LegendListSizingInterface<RuleWithActionsRelationsEntityInterface> = {
    estimatedItemSize: RULES_LIST_ESTIMATED_ITEM_SIZE,
    getItemType: rule => {
        const itemCount = rule.conditions.length + rule.actions.length;

        if (itemCount <= RULES_LIST_SIMPLE_ITEM_LIMIT) {
            return 'simple';
        }

        if (itemCount <= RULES_LIST_MEDIUM_ITEM_LIMIT) {
            return 'medium';
        }

        return 'complex';
    }
};
