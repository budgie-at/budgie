import { useCategorizeInboxGroupChoiceContext } from '../context/categorize-inbox-group-choice.context';

import type { CategorizeInboxGroupChoiceSelectionInterface } from '../interface/categorize-inbox-group-choice-selection.interface';
import type { CategorizeInboxGroupChoiceType } from '../interface/categorize-inbox-group-choice.type';

export const useCategorizeInboxGroupChoiceSelection = (
    choice: CategorizeInboxGroupChoiceType
): CategorizeInboxGroupChoiceSelectionInterface => {
    const { choice: selectedChoice, select } = useCategorizeInboxGroupChoiceContext();

    const isSelected = selectedChoice === choice;

    return { isSelected, accessibilityState: { selected: isSelected }, onSelect: () => void select(choice) };
};
