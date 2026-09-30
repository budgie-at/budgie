import { AccountBalanceRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

export const fetchAccountBalance = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getByAccountId(accountId)).at(0)?.balance;
});
