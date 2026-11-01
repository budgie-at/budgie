import * as Result from 'effect/Result';

export const isValidRulePattern = (pattern: string): boolean => Result.isSuccess(Result.try(() => new RegExp(pattern, 'iu')));
