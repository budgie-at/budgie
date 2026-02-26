import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

export interface SuggestionsResultInterface {
    readonly timePatterns: RepeatedTransactionPatternInterface[];
    readonly amountPatterns: RepeatedTransactionPatternInterface[];
}
