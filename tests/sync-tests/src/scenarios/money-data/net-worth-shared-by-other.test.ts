import { AccountBalanceRepository, AccountTypeEnum, CurrencyEnum, PRECISION, SettingsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seedLedgerBalance, TestLayer } from '../../harness';
import { testDb } from '../../harness/scenario/test-db';
import { seed } from '../../harness/seed/seed';

const OWN_BALANCE = 100 * PRECISION;
const FAMILY_BALANCE = 9970 * PRECISION;

const seedOwnAndFamilyAccounts = Effect.fnUntraced(function* () {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const own = yield* seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CASH, title: 'Own' });
    const family = yield* seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CASH, title: 'Family' });

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    yield* seedLedgerBalance(own.id, OWN_BALANCE);
    yield* seedLedgerBalance(family.id, FAMILY_BALANCE);
    yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
    yield* testDb.$client.unsafe(`UPDATE accounts SET sync_zone = 'household' WHERE id = ${family.id}`);

    return { euro, own, family };
});

describe('net worth excludes accounts shared by other family members', () => {
    it.effect('leaves the household account of another member out of net worth and the liquid total', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { euro } = yield* seedOwnAndFamilyAccounts();

            expect((yield* accountBalanceRepository.getNetWorth(euro.id)).at(0)?.netWorth).toBe(OWN_BALANCE);
            expect((yield* accountBalanceRepository.getLiquidTotal(euro.id, false)).at(0)?.total).toBe(OWN_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a household account that this user shared in net worth', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { euro, family } = yield* seedOwnAndFamilyAccounts();

            yield* testDb.$client.unsafe(
                `INSERT INTO sync_record (sync_zone, sync_id, record_type) SELECT 'personal', sync_id, 'Account' FROM accounts WHERE id = ${family.id}`
            );

            expect((yield* accountBalanceRepository.getNetWorth(euro.id)).at(0)?.netWorth).toBe(OWN_BALANCE + FAMILY_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('flags the account on the home rows', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { euro, own, family } = yield* seedOwnAndFamilyAccounts();
            const rows = yield* accountBalanceRepository.getHomeAccountRows(euro.id);
            const flagOf = (accountId: number) => rows.find(row => row.account.id === accountId)?.isSharedByOther;

            expect(flagOf(own.id)).toBe(0);
            expect(flagOf(family.id)).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
