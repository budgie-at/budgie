import { createContext, use } from 'react';

interface BudgetFormActionsContextInterface {
    readonly handleSubmit: () => Promise<void>;
    readonly isEditing: boolean;
    readonly isLoading: boolean;
}

export const BudgetFormActionsContext = createContext<BudgetFormActionsContextInterface>({
    handleSubmit: () => Promise.resolve(),
    isEditing: false,
    isLoading: false
});

export const useBudgetFormActions = () => use(BudgetFormActionsContext);
