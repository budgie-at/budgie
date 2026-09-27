import { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

import { CategorizeInboxSessionInterface } from './categorize-inbox-session.interface';

export interface CategorizeInboxViewInterface extends Pick<CategorizeInboxSessionInterface, 'clustersByKey'> {
    readonly items: CategorizeInboxListItemType[];
    readonly remainingCount: number;
}
