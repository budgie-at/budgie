import * as Result from 'effect/Result';

import { isDefined } from '@rnw-community/shared';

import { csvAmountCandidates } from './csv-amount-candidates.util';

export const parseCsvAmount = (value: string, decimalSeparator: '.' | ',' | null = null): Result.Result<number, string> => {
    const candidates = csvAmountCandidates(value);
    const candidate =
        candidates.length === 1
            ? candidates[0]
            : (candidates.find(item => item.decimalSeparator === decimalSeparator) ??
              candidates.find(item => !isDefined(item.decimalSeparator)));

    return isDefined(candidate) && (candidates.length === 1 || isDefined(decimalSeparator))
        ? Result.succeed(candidate.amount)
        : Result.fail('invalid or ambiguous amount');
};
