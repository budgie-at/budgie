import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, fetchEnableBankingTransactions, freezeDateClock, testQueryService, TestLayer } from '../../harness';
import { connectWise, EUR_HASH } from '../../harness/enable-banking/wise-scenario';

describe('enable-banking/wise', () => {
    freezeDateClock(new Date('2026-11-11T12:00:00.000Z'));

    it.effect('connects each Wise balance as an account of one integration and pairs the conversion as one transfer', () =>
        Effect.gen(function* () {
            const { eurAccount, usdAccount } = yield* connectWise;

            expect(eurAccount).toMatchObject({ title: 'Wise EUR', externalSource: ExternalSourceEnum.ENABLE_BANKING });
            expect(usdAccount).toMatchObject({ title: 'Wise USD', externalSource: ExternalSourceEnum.ENABLE_BANKING });
            expect(usdAccount.integrationId).not.toBeNull();
            expect(usdAccount.integrationId).toBe(eurAccount.integrationId);
            expect(yield* fetchAccountBalance(eurAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchAccountBalance(usdAccount.id)).toBe(108.2 * PRECISION);

            const consolidation = yield* TransferConsolidationService;

            yield* consolidation.consolidate(null);

            const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonicals).toHaveLength(1);
            expect(canonicals[0]).toMatchObject({ fromAccountId: eurAccount.id, toAccountId: usdAccount.id });
            const topUp = (yield* fetchEnableBankingTransactions()).find(row => row.externalId === `${EUR_HASH}:top-up`);
            expect(topUp).toMatchObject({ type: TransactionTypeEnum.INCOME, consolidationParentTransactionId: null });
        }).pipe(Effect.provide(TestLayer))
    );
});
