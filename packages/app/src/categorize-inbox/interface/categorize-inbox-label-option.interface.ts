import type { CategorizeInboxLabelInterface } from './categorize-inbox-label.interface';

export interface CategorizeInboxLabelOptionInterface {
    readonly label: CategorizeInboxLabelInterface;
    readonly isBestMatch: boolean;
}
