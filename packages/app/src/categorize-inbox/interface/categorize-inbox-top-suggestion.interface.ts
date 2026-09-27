import type { CategorizeInboxLabelInterface } from './categorize-inbox-label.interface';
import type { ViewProps } from 'react-native';

export interface CategorizeInboxTopSuggestionInterface {
    readonly label: CategorizeInboxLabelInterface;
    readonly accept: () => void;
    readonly accessibilityProps: Pick<ViewProps, 'accessibilityActions' | 'onAccessibilityAction'>;
}
