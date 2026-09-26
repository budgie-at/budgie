import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';

import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';

export interface CategorizeInboxClusterItemInterface {
    readonly kind: CategorizeInboxListItemKindEnum.CLUSTER;
    readonly key: string;
    readonly cluster: CategorizeInboxClusterInterface;
}
