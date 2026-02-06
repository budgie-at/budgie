import { SuggestionSource } from './suggestion-source.type';
import { SuggestionStatus } from './suggestion-status.type';

export interface UseSuggestionReturnInterface<T> {
    status: SuggestionStatus;
    suggestions: T[];
    source: SuggestionSource | null;
}
