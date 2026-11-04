import {
    AccountTypeEnum,
    ExternalSourceEnum,
    InstrumentEntityTable,
    SyncEntityTable,
    SyncModeEnum,
    TransactionEntityTable
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import { ENABLE_BANKING_APPLICATION_ID, enableBankingStub } from './enable-banking-stub';

const FAR_FUTURE = '2099-01-01T00:00:00.000Z';
const NINE_HOURS_MS = 9 * 60 * 60 * 1000;

export const buildEnableBankingToken = (
    sessionId: string,
    validUntil = FAR_FUTURE,
    applicationId = ENABLE_BANKING_APPLICATION_ID
): string => JSON.stringify({ applicationId, sessionId, aspspName: 'Synthetic Bank', aspspCountry: 'DE', validUntil });

interface SeedOptions {
    readonly hash: string;
    readonly token: string;
    readonly mode?: SyncModeEnum;
    readonly forwardSyncFromAt?: Date;
    readonly backwardSyncLimitAt?: Date | null;
    readonly backwardSyncFromAt?: Date;
    readonly iban?: string;
}

export const seedEnableBankingAccount = (options: SeedOptions) =>
    Effect.gen(function* () {
        const existingEur = (yield* testDb.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, 'EUR'))).at(0);
        const eur = isDefined(existingEur) ? existingEur : yield* seed.instrument({ code: 'EUR', name: 'Euro', symbol: 'EUR' });
        const account = yield* seed.account({
            externalId: options.hash,
            externalSource: ExternalSourceEnum.ENABLE_BANKING,
            type: AccountTypeEnum.BANK_SYNC,
            instrumentId: eur.id,
            ...(options.iban === undefined ? {} : { iban: options.iban })
        });
        const sync = yield* seed.sync({
            accountId: account.id,
            provider: ExternalSourceEnum.ENABLE_BANKING,
            token: options.token,
            mode: options.mode ?? SyncModeEnum.FORWARD,
            forwardSyncFromAt: options.forwardSyncFromAt ?? new Date(Date.now() - NINE_HOURS_MS),
            backwardSyncFromAt: options.backwardSyncFromAt ?? new Date(),
            backwardSyncLimitAt: options.backwardSyncLimitAt ?? null
        });

        return { account, sync };
    });

export const fetchEnableBankingTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ENABLE_BANKING));

export const makeEnableBankingSyncStale = (syncId: number) =>
    testDb
        .update(SyncEntityTable)
        .set({ forwardSyncedAt: new Date(Date.now() - NINE_HOURS_MS) })
        .where(eq(SyncEntityTable.id, syncId));

export const seedLinkedEnableBankingAccount = (hash: string, uid: string, sessionId: string) =>
    Effect.tap(seedEnableBankingAccount({ hash, token: buildEnableBankingToken(sessionId) }), () =>
        Effect.sync(() => {
            enableBankingStub.session(sessionId, [{ uid, hash }]);
        })
    );

export const fetchSortedEnableBankingExternalIds = () =>
    Effect.map(fetchEnableBankingTransactions(), transactions =>
        transactions.map(transaction => transaction.externalId).sort((left, right) => (left ?? '').localeCompare(right ?? ''))
    );
