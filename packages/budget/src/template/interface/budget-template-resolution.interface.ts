import type { BudgetSuggestedStatsInterface } from './budget-suggested-stats.interface';
import type { BudgetTemplateDraftInterface } from './budget-template-draft.interface';

export interface BudgetTemplateResolutionInterface {
    readonly draft: BudgetTemplateDraftInterface;
    readonly isReady: boolean;
    readonly isAvailable: boolean;
    readonly stats: BudgetSuggestedStatsInterface | null;
}
