import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';

export interface CategorizeInboxSessionInterface {
    readonly placements: ReadonlyMap<string, CategorizeInboxSectionEnum>;
    readonly clustersByKey: ReadonlyMap<string, CategorizeInboxClusterInterface>;
    readonly peakRowCount: number;
}
