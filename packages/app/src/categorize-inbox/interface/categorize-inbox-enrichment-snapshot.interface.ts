import { CategorizeInboxEnrichmentStatusEnum } from '../enum/categorize-inbox-enrichment-status.enum';

import { CategorizeInboxEnrichmentInterface } from './categorize-inbox-enrichment.interface';

export interface CategorizeInboxEnrichmentSnapshotInterface {
    readonly status: CategorizeInboxEnrichmentStatusEnum;
    readonly enrichments: ReadonlyMap<string, CategorizeInboxEnrichmentInterface>;
    readonly processedCount: number;
    readonly totalCount: number;
}
