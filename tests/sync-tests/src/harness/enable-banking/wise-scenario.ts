import { AccountEntityTable } from '@budgie/contracts';
import { EnableBankingSyncService, SyncHistoryDepthEnum, WISE_ASPSP_NAME } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seedExchangeRate } from '../consolidation/seed-exchange-rate';
import { testDb } from '../scenario/test-db';
import { seed } from '../seed/seed';
import { skipRequestedSync } from '../sync-workload/skip-requested-sync';

import { buildPending, CALLBACK_URL } from './enable-banking-connect-scenario';
import { findOrSeedEur } from './enable-banking-scenario';
import { buildEnableBankingTransaction, enableBankingDaysAgo, enableBankingStub } from './enable-banking-stub';

const SESSION = 'session-wise';
const EUR_UID = 'uid-wise-eur';
const USD_UID = 'uid-wise-usd';
export const EUR_HASH = 'hash-wise-eur';
const USD_HASH = 'hash-wise-usd';
const EUR_TO_USD_RATE = 1.1;

export const connectWise = Effect.gen(function* () {
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
        buildPending('state-wise', null, null, WISE_ASPSP_NAME),
        `${CALLBACK_URL}?code=code-wise&state=state-wise`
    );
    yield* skipRequestedSync(service.setupAccountSyncBatch(result.token, result.accounts, [EUR_HASH, USD_HASH], SyncHistoryDepthEnum.FULL));
    yield* skipRequestedSync(service.sync());

    const [eurAccount] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, EUR_HASH));
    const [usdAccount] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, USD_HASH));
    yield* seedExchangeRate(eurAccount.instrumentId, usdAccount.instrumentId, EUR_TO_USD_RATE);

    return { eurAccount, usdAccount };
});
