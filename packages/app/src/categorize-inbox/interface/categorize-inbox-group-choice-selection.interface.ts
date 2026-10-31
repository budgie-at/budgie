import type { AccessibilityState } from 'react-native';

export interface CategorizeInboxGroupChoiceSelectionInterface {
    readonly isSelected: boolean;
    readonly accessibilityState: AccessibilityState;
    readonly onSelect: () => void;
}
