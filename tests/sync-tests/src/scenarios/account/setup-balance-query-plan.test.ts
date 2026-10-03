import { AccountBalanceRepository, AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { explainQueryPlan, seed, TestLayer } from '../../harness';

describe('account/setup-balance-query-plan', () => {
    it.effect('looks up the Monobank setup balance through the unique sync-account index', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            yield* seed.sync({ accountId: account.id });

            const details = yield* explainQueryPlan(accountBalanceRepository.getByAccountId(account.id));

            expect(details.some(detail => detail.includes('SEARCH bank_syncs') && detail.includes('account_id'))).toBe(true);
            expect(details).not.toContain('SCAN bank_syncs');
        }).pipe(Effect.provide(TestLayer))
    );
});
