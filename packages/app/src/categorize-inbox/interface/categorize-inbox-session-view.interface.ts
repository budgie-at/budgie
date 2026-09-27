import type { CategorizeInboxViewInterface } from './categorize-inbox-view.interface';

export interface CategorizeInboxSessionViewInterface extends Pick<CategorizeInboxViewInterface, 'items' | 'remainingCount'> {
    readonly categorizedCount: number;
}
