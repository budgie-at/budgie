import { ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    enableBankingDaysAgo,
    enableBankingStub,
    fetchEnableBankingTransactions,
    freezeDateClock,
    seedEnableBankingAccount,
    TestLayer
} from '../../harness';
import { buildPdfRow, fetchAccountRows, importPdf, noonDaysAgo } from '../../harness/enable-banking/enable-banking-connect-scenario';

const HASH = 'hash-cutoff';
const UID = 'uid-cutoff';
const SESSION = 'session-cutoff';
const LIVE_FROM_DAYS_AGO = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const seedLiveAccount = (backwardSyncLimitAt: Date | null) =>
    seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION), mode: SyncModeEnum.BACKWARD, backwardSyncLimitAt });

const syncLiveHistory = (backwardSyncLimitAt: Date | null) =>
    Effect.gen(function* () {
        const service = yield* EnableBankingSyncService;
        const { account } = yield* seedLiveAccount(backwardSyncLimitAt);
        enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
        enableBankingStub.balances(UID);
        enableBankingStub.transactions(UID, () => ({
            transactions: [
                buildEnableBankingTransaction({ entry_reference: 'earliest-live', booking_date: enableBankingDaysAgo(LIVE_FROM_DAYS_AGO) })
            ]
        }));
        yield* service.sync();

        return account;
    });

const fetchFileExternalIds = (accountId: number) =>
    Effect.map(fetchAccountRows(accountId), rows =>
        rows
            .filter(row => row.externalSource === ExternalSourceEnum.ERSTE)
            .map(row => row.externalId)
            .filter(isDefined)
            .sort((left, right) => left.localeCompare(right))
    );

describe('import/live-connection-cutoff', () => {
    freezeDateClock(new Date('2026-11-04T12:00:00.000Z'));

    it.effect('history depth "all" imports file rows older than the first live day and leaves that day to the live feed', () =>
        Effect.gen(function* () {
            const account = yield* syncLiveHistory(null);

            yield* importPdf(
                [
                    buildPdfRow('older-than-live', noonDaysAgo(LIVE_FROM_DAYS_AGO + 1)),
                    buildPdfRow('boundary-day', new Date(`${enableBankingDaysAgo(LIVE_FROM_DAYS_AGO)}T08:00:00.000Z`)),
                    buildPdfRow('recent', noonDaysAgo(1))
                ],
                HASH
            );

            expect(yield* fetchFileExternalIds(account.id)).toEqual(['older-than-live']);
            expect((yield* fetchEnableBankingTransactions()).map(row => row.externalId)).toEqual([`${HASH}:earliest-live`]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a 24-month depth with 30 days delivered fills the gap before the first live day', () =>
        Effect.gen(function* () {
            const account = yield* syncLiveHistory(new Date(Date.now() - 730 * DAY_MS));

            yield* importPdf(
                [buildPdfRow('gap-row', noonDaysAgo(200)), buildPdfRow('boundary-day', noonDaysAgo(LIVE_FROM_DAYS_AGO))],
                HASH
            );

            expect(yield* fetchFileExternalIds(account.id)).toEqual(['gap-row']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a backfill still running keeps the chosen depth as the cutoff', () =>
        Effect.gen(function* () {
            const { account } = yield* seedLiveAccount(new Date(Date.now() - 60 * DAY_MS));

            yield* importPdf([buildPdfRow('before-limit', noonDaysAgo(90)), buildPdfRow('inside-limit', noonDaysAgo(45))], HASH);

            expect(yield* fetchFileExternalIds(account.id)).toEqual(['before-limit']);
        }).pipe(Effect.provide(TestLayer))
    );
});
