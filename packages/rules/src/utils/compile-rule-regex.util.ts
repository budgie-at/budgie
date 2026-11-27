import * as Result from 'effect/Result';

const MAX_REGEX_LENGTH = 200;
const NESTED_QUANTIFIER_PATTERN = /([+*}])\)?[+*{]/u;

export const compileRuleRegex = (pattern: string): RegExp | null => {
    if (pattern.length > MAX_REGEX_LENGTH || NESTED_QUANTIFIER_PATTERN.test(pattern)) {
        return null;
    }

    return Result.getOrNull(Result.try(() => new RegExp(pattern, 'iu')));
};
