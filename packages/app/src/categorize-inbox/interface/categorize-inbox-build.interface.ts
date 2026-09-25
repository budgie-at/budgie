import type { CategorizeInboxEvidenceIndex } from '../service/categorize-inbox-evidence-index';
import type { CategorizeInboxBuildInputInterface } from './categorize-inbox-build-input.interface';
import type { CategorizeInboxEnrichmentRequestInterface } from './categorize-inbox-enrichment-request.interface';
import type { CategorizeInboxPosteriorInterface } from './categorize-inbox-posterior.interface';
import type { CategorizeInboxInterface } from './categorize-inbox.interface';

export interface CategorizeInboxBuildInterface {
    readonly input: CategorizeInboxBuildInputInterface;
    readonly inbox: CategorizeInboxInterface;
    readonly enrichmentRequests: CategorizeInboxEnrichmentRequestInterface[];
    readonly index: CategorizeInboxEvidenceIndex;
    readonly posteriors: ReadonlyMap<string, CategorizeInboxPosteriorInterface>;
}
