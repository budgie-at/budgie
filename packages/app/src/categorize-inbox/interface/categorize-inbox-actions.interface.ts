import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';

export interface CategorizeInboxActionsInterface {
    readonly contextValue: CategorizeInboxContextValueInterface;
    readonly progress: number;
}
