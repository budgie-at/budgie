import { CategorizeInboxCandidateInterface } from './categorize-inbox-candidate.interface';

export interface CategorizeInboxScoreInterface {
    readonly candidates: CategorizeInboxCandidateInterface[];
    readonly isConfident: boolean;
}
