import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountBalanceRepository, AccountEntityTable, InstrumentEntityTable } from '@budgie/contracts';
import { afterAll, describe, expect, it } from '@effect/vitest';
import { eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { testDb, TestLayer } from '../../harness';
import { backupDatabasePath } from '../../harness/scenario/setup';

const REPLAY_TIMEOUT_MS = 600_000;
const ACCEPTED_ACCOUNT_IDS = new Set((process.env['BUDGIE_BACKUP_ACCEPT'] ?? '').split(',').filter(isNotEmptyString).map(Number));

const snapshotBalances = Effect.fnUntraced(function* (accountIds: number[]) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return {
        ledger: yield* accountBalanceRepository.getLedgerBalances(accountIds),
        stored: new Map((yield* accountBalanceRepository.getByAccountIds(accountIds)).map(({ accountId, amount }) => [accountId, amount]))
    };
});

const formatAmount = (amount: number | undefined): string => (isDefined(amount) ? convertFromMicroUnits(amount).toFixed(2) : '-');

describe.skipIf(!isDefined(backupDatabasePath))('database/backup-replay', () => {
    afterAll(() => testDb.$client.closeAsync());

    it.effect(
        'replays consolidation and the balance rebuild on a migrated real backup without moving any ledger balance',
        () =>
            Effect.gen(function* () {
                const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
                const transferConsolidationService = yield* TransferConsolidationService;
                const accounts = testDb
                    .select({ id: AccountEntityTable.id, title: AccountEntityTable.title, currency: InstrumentEntityTable.code })
                    .from(AccountEntityTable)
                    .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                    .where(isNull(AccountEntityTable.deletedAt))
                    .all();
                const accountIds = accounts.map(({ id }) => id);
                const before = yield* snapshotBalances(accountIds);

                yield* transferConsolidationService.consolidate(null);
                yield* accountBalanceIncrementalService.updateAllBalances(false);
                const after = yield* snapshotBalances(accountIds);
                const rows = accounts.map(({ id, title, currency }) =>
                    [
                        id,
                        title,
                        currency,
                        ...[before.stored, after.stored, before.ledger, after.ledger].map(balances => formatAmount(balances.get(id)))
                    ].join('\t')
                );

                process.stdout.write(`id\ttitle\tcurrency\tstoredBefore\tstoredAfter\tledgerBefore\tledgerAfter\n${rows.join('\n')}\n`);

                expect(
                    accountIds.filter(id => !ACCEPTED_ACCOUNT_IDS.has(id) && (after.ledger.get(id) ?? 0) !== (before.ledger.get(id) ?? 0))
                ).toEqual([]);
            }).pipe(Effect.provide(TestLayer)),
        REPLAY_TIMEOUT_MS
    );
});
