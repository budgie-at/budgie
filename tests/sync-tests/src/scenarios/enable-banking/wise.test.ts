import {
    AccountEntityTable,
    ExternalSourceEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { EnableBankingSyncService, SyncHistoryDepthEnum, WISE_ASPSP_NAME } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingDaysAgo,
    enableBankingStub,
    fetchAccountBalance,
    fetchEnableBankingTransactions,
    findOrSeedEur,
    freezeDateClock,
    seed,
    skipRequestedSync,
    testDb,
    testQueryService,
    TestLayer
} from '../../harness';

const SESSION = 'session-wise';
const EUR_UID = 'uid-wise-eur';
const USD_UID = 'uid-wise-usd';
const EUR_HASH = 'hash-wise-eur';
const USD_HASH = 'hash-wise-usd';

const connectWise = Effect.gen(function* () {
    const service = yield* EnableBankingSyncService;
    yield* findOrSeedEur;
    yield* seed.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
    enableBankingStub.authorizeSession(
        SESSION,
        WISE_ASPSP_NAME,
        [
            { uid: EUR_UID, identification_hash: EUR_HASH, identification_hashes: [EUR_HASH], cash_account_type: 'CACC', currency: 'EUR' },
            { uid: USD_UID, identification_hash: USD_HASH, identification_hashes: [USD_HASH], cash_account_type: 'CACC', currency: 'USD' }
        ],
        '2099-06-01T00:00:00.000Z'
    );
    enableBankingStub.session(SESSION, [
        { uid: EUR_UID, hash: EUR_HASH },
        { uid: USD_UID, hash: USD_HASH }
    ]);
    enableBankingStub.balances(EUR_UID, '1000.00', 'CLBD');
    enableBankingStub.balances(USD_UID, '108.20', 'CLBD', undefined, 'USD');
    enableBankingStub.transactions(EUR_UID, () => ({
        transactions: [
            buildEnableBankingTransaction({
                entry_reference: 'conversion',
                booking_date: enableBankingDaysAgo(1),
                transaction_amount: { amount: '100.00', currency: 'EUR' },
                creditor: { name: 'Synthetic Conversion' }
            }),
            buildEnableBankingTransaction({
                entry_reference: 'top-up',
                booking_date: enableBankingDaysAgo(3),
                transaction_amount: { amount: '1100.00', currency: 'EUR' },
                credit_debit_indicator: 'CRDT',
                creditor: null,
                debtor: { name: 'Synthetic Other Bank' }
            })
        ]
    }));
    enableBankingStub.transactions(USD_UID, () => ({
        transactions: [
            buildEnableBankingTransaction({
                entry_reference: 'conversion',
                booking_date: enableBankingDaysAgo(1),
                transaction_amount: { amount: '108.20', currency: 'USD' },
                credit_debit_indicator: 'CRDT',
                creditor: null,
                debtor: { name: 'Synthetic Conversion' }
            })
        ]
    }));

    const result = yield* service.completeAuthorization(
        {
            state: 'state-wise',
            applicationId: ENABLE_BANKING_APPLICATION_ID,
            aspspName: WISE_ASPSP_NAME,
            aspspCountry: 'DE',
            integrationId: null,
            connectAccountId: null,
            callbackUrl: 'budgie://enable-banking/callback',
            expiresAtMs: Date.now() + 60_000
        },
        'budgie://enable-banking/callback?code=code-wise&state=state-wise'
    );
    yield* skipRequestedSync(service.setupAccountSyncBatch(result.token, result.accounts, [EUR_HASH, USD_HASH], SyncHistoryDepthEnum.FULL));
    yield* skipRequestedSync(service.sync());

    const [eurAccount] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, EUR_HASH));
    const [usdAccount] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, USD_HASH));

    return { eurAccount, usdAccount };
});

describe('enable-banking/wise', () => {
    freezeDateClock(new Date('2026-11-11T12:00:00.000Z'));

    it.effect('connects every Wise balance as its own account of one integration', () =>
        Effect.gen(function* () {
            const { eurAccount, usdAccount } = yield* connectWise;

            expect(eurAccount).toMatchObject({ title: 'Wise EUR', externalSource: ExternalSourceEnum.ENABLE_BANKING });
            expect(usdAccount).toMatchObject({ title: 'Wise USD', externalSource: ExternalSourceEnum.ENABLE_BANKING });
            expect(usdAccount.integrationId).not.toBeNull();
            expect(usdAccount.integrationId).toBe(eurAccount.integrationId);
            expect(
                (yield* fetchEnableBankingTransactions()).filter(row =>
                    [`${EUR_HASH}:conversion`, `${USD_HASH}:conversion`].includes(row.externalId ?? '')
                )
            ).toHaveLength(2);
            expect(yield* fetchAccountBalance(eurAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchAccountBalance(usdAccount.id)).toBe(108.2 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pairs the EUR to USD conversion as one transfer and leaves the top-up an income', () =>
        Effect.gen(function* () {
            const { eurAccount, usdAccount } = yield* connectWise;
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
