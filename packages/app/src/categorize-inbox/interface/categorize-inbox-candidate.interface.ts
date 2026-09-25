import { CategorizeInboxCandidateSourceEnum } from '../enum/categorize-inbox-candidate-source.enum';

export interface CategorizeInboxCandidateInterface {
    readonly categoryId: number;
    readonly probability: number;
    readonly source: CategorizeInboxCandidateSourceEnum;
}
