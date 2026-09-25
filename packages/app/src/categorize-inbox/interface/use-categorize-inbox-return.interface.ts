import { CategorizeInboxEnrichmentStatusEnum } from '../enum/categorize-inbox-enrichment-status.enum';

import { CategorizeInboxInterface } from './categorize-inbox.interface';

export interface UseCategorizeInboxReturnInterface {
    readonly inbox: CategorizeInboxInterface;
    readonly isLoading: boolean;
    readonly enrichmentStatus: CategorizeInboxEnrichmentStatusEnum;
}
