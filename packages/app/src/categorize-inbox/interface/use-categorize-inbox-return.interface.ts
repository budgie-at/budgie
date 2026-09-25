import { CategorizeInboxInterface } from './categorize-inbox.interface';

export interface UseCategorizeInboxReturnInterface {
    readonly inbox: CategorizeInboxInterface;
    readonly isLoading: boolean;
}
