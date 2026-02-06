import { SuggestionStatus } from './suggestion-status.type';

export interface UseSuggestionReturnInterface<T> {
    status: SuggestionStatus;
    suggestions: T[];
}
