import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import { AccountBalanceRepository, AccountTypeEnum, convertToMicroUnits, Db } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { AccountService } from '../src/account/service/account.service';

import { seed, TestLayer } from './ledger-test-layer';

const TARGET_BALANCE = 3100;

describe('AccountService', () => {
    it.effect('updating only the balance of an account adjusts it to the target', () =>
        Effect.gen(function* () {
            const accountService = yield* AccountService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });

            yield* accountService.updateById(account.id, { currentBalance: TARGET_BALANCE });

            const [balance] = yield* accountBalanceRepository.getByAccountIds([account.id]);

            expect(balance.amount).toBe(convertToMicroUnits(TARGET_BALANCE));
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );
});
