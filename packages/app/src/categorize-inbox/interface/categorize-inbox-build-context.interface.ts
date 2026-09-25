import type { CategorizeInboxEvidenceIndex } from '../service/categorize-inbox-evidence-index';
import type { CategorizeInboxPosteriorInterface } from './categorize-inbox-posterior.interface';

export interface CategorizeInboxBuildContextInterface {
    readonly index: CategorizeInboxEvidenceIndex;
    readonly defaultInstrumentId: number;
    readonly posteriors: Map<string, CategorizeInboxPosteriorInterface>;
}
