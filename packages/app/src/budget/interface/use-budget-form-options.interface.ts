import type { BudgetTemplateKindEnum } from '../enum/budget-template-kind.enum';

export interface UseBudgetFormOptionsInterface {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind?: BudgetTemplateKindEnum | null;
}
