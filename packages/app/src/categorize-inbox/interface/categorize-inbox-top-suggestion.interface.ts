import type { CategoryEntityInterface } from '@budgie/contracts';
import type { ViewProps } from 'react-native';

export interface CategorizeInboxTopSuggestionInterface {
    readonly category: Pick<CategoryEntityInterface, 'id' | 'title' | 'icon'>;
    readonly accept: () => void;
    readonly accessibilityProps: Pick<ViewProps, 'accessibilityActions' | 'onAccessibilityAction'>;
}
