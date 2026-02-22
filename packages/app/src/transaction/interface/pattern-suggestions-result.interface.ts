import { SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

export interface PatternSuggestionsResultInterface {
    readonly status: SuggestionStatus;
    readonly timePatterns: RepeatedTransactionPatternInterface[];
    readonly amountPatterns: RepeatedTransactionPatternInterface[];
}
