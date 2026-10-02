import { AccountBalanceRepository, AccountTypeEnum, ExchangeRateEntityTable, PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, seedBitcoinCryptoAccount, seedLedgerBalance, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const BITCOIN_EURO_RATE = 50_000;
const BITCOIN_BALANCE = 2 * PRECISION;
const CASH_BALANCE = 3_000 * PRECISION;
const BITCOIN_EURO_VALUE = BITCOIN_BALANCE * BITCOIN_EURO_RATE;

const seedLiquidFixture = Effect.fnUntraced(function* () {
    const { bitcoin, euro } = yield* seedBitcoinCryptoAccount(BITCOIN_BALANCE);
    const cashAccount = seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CASH });

    yield* seedLedgerBalance(cashAccount.id, CASH_BALANCE);
    insertOne(ExchangeRateEntityTable, {
        source: 'test',
        baseInstrumentId: bitcoin.id,
        quoteInstrumentId: euro.id,
        rate: BITCOIN_EURO_RATE
    });

    return euro;
});

describe('runway/liquid-total-crypto', () => {
    it.effect('excludes crypto accounts from the liquid total by default', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const euro = yield* seedLiquidFixture();

            const liquidTotal = (yield* accountBalanceRepository.getLiquidTotal(euro.id, false)).at(0);

            expect(liquidTotal?.total).toBe(CASH_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('adds crypto accounts at market value when crypto is included', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const euro = yield* seedLiquidFixture();

            const liquidTotal = (yield* accountBalanceRepository.getLiquidTotal(euro.id, true)).at(0);

            expect(liquidTotal?.total).toBe(CASH_BALANCE + BITCOIN_EURO_VALUE);
        }).pipe(Effect.provide(TestLayer))
    );
});
