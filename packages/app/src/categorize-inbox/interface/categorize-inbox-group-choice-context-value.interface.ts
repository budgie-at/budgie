import type { CategorizeInboxGroupChoiceType } from './categorize-inbox-group-choice.type';

export interface CategorizeInboxGroupChoiceContextValueInterface {
    readonly choice: CategorizeInboxGroupChoiceType | null;
    readonly select: (choice: CategorizeInboxGroupChoiceType) => void;
}
