import type { LegendListSizingInterface } from '../../@generic/interface/legend-list-sizing.interface';
import type { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';

const RULES_LIST_ESTIMATED_ITEM_SIZE = 116;

export const RULES_LIST_SIZING: LegendListSizingInterface<RuleWithActionsRelationsEntityInterface> = {
    estimatedItemSize: RULES_LIST_ESTIMATED_ITEM_SIZE
};
